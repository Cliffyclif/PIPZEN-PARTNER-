import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CrmApiError, sendPlatformEvent, type PlatformEventBody } from "./client";
import { configuredApiEnvironments, environmentForEmail, isCrmApiConfigured, type CrmEnvironment } from "./config";
import { toExternalId } from "./customer";
import { ensureCrmTables } from "./schema";

// Platform to CRM account events (contract section 6), delivered through an
// outbox so a CRM outage never blocks or loses an admin action.

export type PlatformEventType =
  | "customer.updated"
  | "account.restricted"
  | "account.unrestricted"
  | "withdrawal.failed"
  | "security.changed";

const RETRY_DELAYS_MINUTES = [1, 5, 30, 120, 360, 720, 1440];
const MAX_ATTEMPTS = RETRY_DELAYS_MINUTES.length + 1;
const LOCK_MS = 2 * 60_000;

function describe(error: unknown) {
  if (error instanceof CrmApiError) return `${error.status} ${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : String(error);
}

// Queues an event for a partner and tries to deliver it straight away. Never
// throws: callers are business flows that must not fail because of the CRM.
export async function emitPlatformEvent(
  type: PlatformEventType,
  user: { id: string; email: string },
  data: Record<string, unknown>
) {
  const environment = environmentForEmail(user.email);
  if (!isCrmApiConfigured(environment)) return;
  try {
    await ensureCrmTables();
    const event: PlatformEventBody = {
      id: `evt_${randomUUID()}`,
      type,
      occurred_at: new Date().toISOString(),
      customer_external_id: toExternalId(user.id),
      data,
    };
    await prisma.crmOutboxEvent.create({
      data: {
        id: event.id,
        environment,
        type,
        customerExternalId: event.customer_external_id,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });
    deliverOutboxEvents([event.id]).catch((error) =>
      console.error("[crymad-crm] Immediate event delivery failed; the worker will retry", error)
    );
  } catch (error) {
    console.error(`[crymad-crm] Could not queue ${type} event`, error);
  }
}

function dueFilter(now: Date, environments: CrmEnvironment[]): Prisma.CrmOutboxEventWhereInput {
  return {
    environment: { in: environments },
    sentAt: null,
    deadAt: null,
    nextAttemptAt: { lte: now },
    OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
  };
}

// Takes a row for this process; a no-op if another instance got there first.
async function claim(id: string, environments: CrmEnvironment[]) {
  const now = new Date();
  const { count } = await prisma.crmOutboxEvent.updateMany({
    where: { id, ...dueFilter(now, environments) },
    data: { lockedUntil: new Date(now.getTime() + LOCK_MS), attempts: { increment: 1 } },
  });
  return count === 1;
}

export async function deliverOutboxEvents(ids?: string[]) {
  const environments = configuredApiEnvironments();
  if (environments.length === 0) return 0;
  const due = await prisma.crmOutboxEvent.findMany({
    where: { ...dueFilter(new Date(), environments), ...(ids ? { id: { in: ids } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 25,
    select: { id: true },
  });

  let delivered = 0;
  for (const { id } of due) {
    if (!(await claim(id, environments))) continue;
    const row = await prisma.crmOutboxEvent.findUnique({ where: { id } });
    if (!row) continue;
    try {
      await sendPlatformEvent(row.environment as CrmEnvironment, row.payload as unknown as PlatformEventBody);
      await prisma.crmOutboxEvent.update({
        where: { id },
        data: { sentAt: new Date(), lockedUntil: null, lastError: null },
      });
      delivered++;
    } catch (error) {
      const permanent = error instanceof CrmApiError && !error.retryable;
      const dead = permanent || row.attempts >= MAX_ATTEMPTS;
      const delay = RETRY_DELAYS_MINUTES[Math.min(row.attempts - 1, RETRY_DELAYS_MINUTES.length - 1)];
      await prisma.crmOutboxEvent.update({
        where: { id },
        data: {
          lockedUntil: null,
          lastError: describe(error).slice(0, 1000),
          deadAt: dead ? new Date() : null,
          nextAttemptAt: new Date(Date.now() + delay * 60_000),
        },
      });
      if (dead) console.error(`[crymad-crm] Gave up delivering ${row.type} event ${id}: ${describe(error)}`);
    }
  }
  return delivered;
}
