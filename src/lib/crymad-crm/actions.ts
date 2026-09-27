import type { User } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendAccountLockedEmail } from "@/lib/email";
import type { CrmEnvironment } from "./config";
import { sha256Hex } from "./crypto";
import { findPartnerById, parseExternalId, partnerStatus, toExternalId } from "./customer";
import { emitPlatformEvent } from "./events";
import { ensureCrmTables } from "./schema";

// Actions the CRM may run against Pipzen (contract section 7, v1.1). Low and
// medium risk run immediately; high risk needs a second approver who is not
// the requesting agent. Every action supports dry_run.

type Risk = "low" | "medium" | "high";
type ActionStatus = "completed" | "dry_run" | "already_applied";

const inputSchema = z.object({
  customer_external_id: z.string().min(1).max(200),
  reason: z.string().trim().min(1).max(2000),
  ticket_id: z.string().min(1).max(200),
  agent_id: z.string().min(1).max(200),
  approved_by: z.string().min(1).max(200).optional().nullable(),
  verification_ref: z.string().min(1).max(200).optional().nullable(),
  dry_run: z.boolean().optional(),
});

type ActionInput = z.infer<typeof inputSchema>;

interface ActionDefinition {
  risk: Risk;
  description: string;
  requiresVerificationRef?: boolean;
  run(ctx: { partner: User; input: ActionInput; dryRun: boolean }): Promise<{
    status: ActionStatus;
    result: Record<string, unknown>;
  }>;
}

const LOCK_EFFECTS = [
  "Partner portal sign-in is blocked",
  "Active portal sessions stop working",
  "New commission withdrawals are blocked",
];

const ACTIONS: Record<string, ActionDefinition> = {
  lock_partner_account: {
    risk: "medium",
    description:
      "Locks a partner account: blocks partner portal sign-in, ends active sessions and blocks new commission withdrawals until a Pipzen admin unlocks it.",
    async run({ partner, input, dryRun }) {
      if (partner.status === "BANNED") {
        return { status: "already_applied", result: { account_status: "locked", restrictions: ["account_locked"] } };
      }
      const pendingWithdrawals = await prisma.withdrawal.count({ where: { userId: partner.id, status: "PENDING" } });
      if (dryRun) {
        return {
          status: "dry_run",
          result: {
            account_status: partnerStatus(partner.status),
            would_become: "locked",
            effects: LOCK_EFFECTS,
            pending_withdrawals: pendingWithdrawals,
          },
        };
      }
      await prisma.user.update({ where: { id: partner.id }, data: { status: "BANNED" } });
      await emitPlatformEvent("account.restricted", partner, {
        restrictions: ["account_locked"],
        source: "crm_action",
        action: "lock_partner_account",
        ticket_id: input.ticket_id,
      });
      // The contract asks platforms to email the customer about locks.
      let partnerEmailed = true;
      try {
        await sendAccountLockedEmail(partner.email, partner.fullName);
      } catch (error) {
        partnerEmailed = false;
        console.error("[crymad-crm] Account locked email failed", error);
      }
      return {
        status: "completed",
        result: {
          account_status: "locked",
          restrictions: ["account_locked"],
          effects: LOCK_EFFECTS,
          // Pending withdrawals are left for a Pipzen admin to approve or reject.
          pending_withdrawals: pendingWithdrawals,
          partner_emailed: partnerEmailed,
        },
      };
    },
  },
};

export function actionManifest() {
  return Object.entries(ACTIONS).map(([name, action]) => ({
    name,
    risk: action.risk,
    description: action.description,
    supports_dry_run: true,
    requires_second_approver: action.risk === "high",
    requires_verification_ref: Boolean(action.requiresVerificationRef),
  }));
}

export interface ActionResponse {
  status: number;
  body: unknown;
  // Set on a replay: the first response exactly as it was sent.
  replayedBody?: string;
}

const error = (status: number, code: string, message: string, details?: unknown[]): ActionResponse => ({
  status,
  body: { error: { code, message, ...(details ? { details } : {}) } },
});

// Key order independent, so a retry with the same data always matches.
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const STALE_IN_PROGRESS_MS = 5 * 60_000;

export async function executeAction(
  env: CrmEnvironment,
  name: string,
  rawBody: Buffer,
  idempotencyKey: string | null,
  dryRunFromQuery: boolean
): Promise<ActionResponse> {
  const action = ACTIONS[name];
  if (!action) return error(404, "unknown_action", `Pipzen does not offer the action "${name}"`);

  let json: unknown;
  try {
    json = JSON.parse(rawBody.toString("utf8") || "{}");
  } catch {
    return error(400, "invalid_json", "Request body is not valid JSON");
  }
  const parsed = inputSchema.safeParse(json);
  if (!parsed.success) {
    return error(
      400,
      "validation_failed",
      "Request body is invalid",
      parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }))
    );
  }
  const input = parsed.data;
  const dryRun = input.dry_run === true || dryRunFromQuery;

  if (!idempotencyKey || idempotencyKey.length > 255) {
    return error(400, "idempotency_key_required", "An Idempotency-Key header (max 255 characters) is required");
  }
  if (action.risk === "high") {
    if (!input.approved_by) return error(403, "approval_required", "High-risk actions need approved_by");
    if (input.approved_by === input.agent_id) {
      return error(403, "approver_is_requester", "The approver must be a different staff member from the requesting agent");
    }
  }
  if (action.requiresVerificationRef && !input.verification_ref) {
    return error(400, "verification_ref_required", "This action needs a verification_ref");
  }

  await ensureCrmTables();
  const key = `action:${env}:${name}:${idempotencyKey}`;
  const requestHash = sha256Hex(canonicalJson({ ...input, dry_run: dryRun }));

  const { count } = await prisma.crmIdempotencyKey.createMany({
    data: [{ key, requestHash }],
    skipDuplicates: true,
  });
  if (count === 0) {
    const existing = await prisma.crmIdempotencyKey.findUnique({ where: { key } });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return error(409, "idempotency_conflict", "This Idempotency-Key was already used with different data");
      }
      if (existing.status === "completed" && existing.responseStatus !== null) {
        return { status: existing.responseStatus, body: null, replayedBody: existing.responseBody ?? "null" };
      }
      if (Date.now() - existing.createdAt.getTime() < STALE_IN_PROGRESS_MS) {
        return error(409, "request_in_progress", "A request with this Idempotency-Key is still being processed");
      }
      // A previous attempt died mid-way; take it over.
      await prisma.crmIdempotencyKey.update({ where: { key }, data: { createdAt: new Date() } });
    }
  }

  try {
    const userId = parseExternalId(input.customer_external_id);
    const partner = userId ? await findPartnerById(env, userId) : null;

    let response: ActionResponse;
    let outcome: string;
    if (!partner) {
      response = error(404, "customer_not_found", "No Pipzen partner has this customer_external_id");
      outcome = "customer_not_found";
    } else {
      const { status, result } = await action.run({ partner, input, dryRun });
      response = {
        status: 200,
        body: {
          action: name,
          status,
          dry_run: dryRun,
          customer_external_id: toExternalId(partner.id),
          result,
        },
      };
      outcome = status;
    }

    await prisma.crmActionLog.create({
      data: {
        action: name,
        customerExternalId: input.customer_external_id,
        agentId: input.agent_id,
        approvedBy: input.approved_by ?? null,
        ticketId: input.ticket_id,
        reason: input.reason,
        verificationRef: input.verification_ref ?? null,
        dryRun,
        outcome,
      },
    });
    await prisma.crmIdempotencyKey.update({
      where: { key },
      data: { status: "completed", responseStatus: response.status, responseBody: JSON.stringify(response.body) },
    });
    return response;
  } catch (cause) {
    // Let the CRM retry with the same key.
    await prisma.crmIdempotencyKey.delete({ where: { key } }).catch(() => undefined);
    throw cause;
  }
}
