import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { CrmApiError, getTicket, listCustomerTickets, type TicketDetail } from "./client";
import { environmentForEmail, isCrmApiConfigured, type CrmEnvironment } from "./config";
import { toExternalId } from "./customer";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9-]{8,64}$/;

// Browser-supplied keys are namespaced per partner so they can never collide
// with another partner's request.
export function portalIdempotencyKey(userId: string, supplied: string | null) {
  const key = supplied && IDEMPOTENCY_KEY.test(supplied) ? supplied : randomUUID();
  return `pz-portal-${userId}-${key}`;
}

export interface PartnerSupportContext {
  user: { id: string; email: string; fullName: string | null };
  environment: CrmEnvironment;
  externalId: string;
  configured: boolean;
}

// The signed-in partner, the CRM environment they belong to, and whether that
// environment has an API key.
export async function getPartnerSupportContext(userId: string): Promise<PartnerSupportContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true },
  });
  if (!user) return null;
  const environment = environmentForEmail(user.email);
  return {
    user,
    environment,
    externalId: toExternalId(user.id),
    configured: isCrmApiConfigured(environment),
  };
}

// Returns the ticket only if it belongs to this customer. The secret API key
// can read every Pipzen ticket, so ownership is checked here, never assumed.
export async function getOwnedTicket(
  env: CrmEnvironment,
  ticketId: string,
  externalId: string
): Promise<TicketDetail | null> {
  let ticket: TicketDetail;
  try {
    ticket = await getTicket(env, ticketId);
  } catch (error) {
    if (error instanceof CrmApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }

  if (ticket.customerExternalId) return ticket.customerExternalId === externalId ? ticket : null;

  // The ticket body did not name its customer: confirm through the customer's own list.
  let cursor: string | null = null;
  for (let page = 0; page < 10; page++) {
    const result = await listCustomerTickets(env, externalId, { cursor, limit: 50 });
    if (result.tickets.some((t) => t.id === ticket.id || t.id === ticketId)) return ticket;
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return null;
}
