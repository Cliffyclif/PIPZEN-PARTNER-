import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CrmEnvironment } from "./config";
import { findPartnerById, parseExternalId } from "./customer";
import { ensureCrmTables } from "./schema";
import { htmlToPlainText } from "./text";

// CRM to platform webhooks (contract section 5). Events are stored first
// (deduplicated on X-CMX-Event-Id per environment), acknowledged, then turned
// into partner notifications.

const LOCK_MS = 2 * 60_000;
const MAX_ATTEMPTS = 5;

export function webhookRowId(environment: CrmEnvironment, eventId: string) {
  return `${environment}:${eventId}`;
}

// Returns false when the event id was already received (a CRM retry or replay).
export async function recordWebhookEvent(environment: CrmEnvironment, eventId: string, type: string, payload: unknown) {
  await ensureCrmTables();
  const { count } = await prisma.crmWebhookEvent.createMany({
    data: [
      {
        id: webhookRowId(environment, eventId),
        environment,
        type,
        payload: (payload ?? {}) as Prisma.InputJsonValue,
      },
    ],
    skipDuplicates: true,
  });
  return count === 1;
}

type Json = Record<string, unknown>;

function pick(source: unknown, paths: string[]): unknown {
  for (const path of paths) {
    let node: unknown = source;
    for (const key of path.split(".")) {
      node = node && typeof node === "object" ? (node as Json)[key] : undefined;
    }
    if (node !== undefined && node !== null && node !== "") return node;
  }
  return undefined;
}

const text = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value) : null);

type Outcome = "processed" | "ignored";

async function handleEvent(environment: CrmEnvironment, type: string, payload: Json): Promise<Outcome> {
  const externalId = text(
    pick(payload, [
      "data.customer.external_id",
      "data.customer_external_id",
      "data.ticket.customer.external_id",
      "customer.external_id",
      "customer_external_id",
      "ticket.customer.external_id",
    ])
  );
  const userId = externalId ? parseExternalId(externalId) : null;
  // Only partners of the environment whose secret signed the event.
  const partner = userId ? await findPartnerById(environment, userId) : null;
  if (!partner) return "ignored";

  const ticketId =
    text(pick(payload, ["data.ticket.id", "data.ticket_id", "ticket.id", "ticket_id"])) ??
    (type.startsWith("ticket.") ? text(pick(payload, ["data.id", "id"])) : null);
  const ticketNumber = text(pick(payload, ["data.ticket.number", "data.number", "ticket.number"]));
  const ticketLabel = ticketNumber ? `Ticket #${ticketNumber}` : "Your support ticket";
  const data = {
    source: "crymad_crm",
    ticketId,
    ticketNumber,
    href: ticketId ? `/support/${encodeURIComponent(ticketId)}` : "/support",
  };

  if (type === "message.created") {
    const author = text(
      pick(payload, ["data.message.author_type", "data.message.author.type", "data.author_type", "data.author.type"])
    );
    if (author === "customer" || author === "contact") return "ignored";
    const body = htmlToPlainText(text(pick(payload, ["data.message.body", "data.body", "message.body"])) ?? "", false);
    await prisma.notification.create({
      data: {
        userId: partner.id,
        type: "MESSAGE",
        title: "Pipzen Support replied",
        message: body ? `${ticketLabel}: ${body.length > 180 ? `${body.slice(0, 177)}...` : body}` : `${ticketLabel} has a new reply.`,
        data,
      },
    });
    return "processed";
  }

  if (type === "ticket.status_changed" || type === "ticket.closed") {
    const status =
      text(pick(payload, ["data.ticket.status", "data.status", "data.new_status", "ticket.status"])) ??
      (type === "ticket.closed" ? "closed" : null);
    if (!status) return "ignored";
    await prisma.notification.create({
      data: {
        userId: partner.id,
        type: "SYSTEM",
        title: "Support ticket updated",
        message: `${ticketLabel} is now ${status.replace(/_/g, " ")}.`,
        data,
      },
    });
    return "processed";
  }

  return "ignored";
}

async function claim(id: string) {
  const now = new Date();
  const { count } = await prisma.crmWebhookEvent.updateMany({
    where: { id, status: "received", OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
    data: { lockedUntil: new Date(now.getTime() + LOCK_MS), attempts: { increment: 1 } },
  });
  return count === 1;
}

export async function processWebhookEvents(ids?: string[]) {
  const now = new Date();
  const pending = await prisma.crmWebhookEvent.findMany({
    where: {
      status: "received",
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      ...(ids ? { id: { in: ids } } : {}),
    },
    orderBy: { receivedAt: "asc" },
    take: 50,
    select: { id: true },
  });

  for (const { id } of pending) {
    if (!(await claim(id))) continue;
    const event = await prisma.crmWebhookEvent.findUnique({ where: { id } });
    if (!event) continue;
    try {
      const outcome = await handleEvent(event.environment as CrmEnvironment, event.type, (event.payload ?? {}) as Json);
      await prisma.crmWebhookEvent.update({
        where: { id },
        data: { status: outcome, processedAt: new Date(), lockedUntil: null, lastError: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await prisma.crmWebhookEvent.update({
        where: { id },
        data: {
          status: event.attempts >= MAX_ATTEMPTS ? "failed" : "received",
          lockedUntil: null,
          lastError: message.slice(0, 1000),
        },
      });
      console.error(`[crymad-crm] Webhook ${event.type} ${id} failed: ${message}`);
    }
  }
}
