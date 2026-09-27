import { NextResponse } from "next/server";
import { requirePartner, handleApiError } from "@/lib/auth-guard";
import { CrmApiError, createTicket, listCustomerTickets } from "@/lib/crymad-crm/client";
import { getPartnerSupportContext, portalIdempotencyKey } from "@/lib/crymad-crm/partner-support";
import { supportTicketSchema } from "@/lib/validations/support";
import { z } from "zod";

export const dynamic = "force-dynamic";

const unavailable = () =>
  NextResponse.json(
    { error: "Support is temporarily unavailable. Please email support@pipzen.io." },
    { status: 503 }
  );

// The partner's own tickets, for the Support page ("load more").
export async function GET(req: Request) {
  try {
    const session = await requirePartner();
    const ctx = await getPartnerSupportContext(session.user.id);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!ctx.configured) return unavailable();
    const cursor = new URL(req.url).searchParams.get("cursor");
    const page = await listCustomerTickets(ctx.environment, ctx.externalId, { cursor, limit: 20 });
    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof CrmApiError) {
      console.error("[crymad-crm] Listing tickets failed", error);
      return unavailable();
    }
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePartner();
    const ctx = await getPartnerSupportContext(session.user.id);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!ctx.configured) return unavailable();
    const data = supportTicketSchema.parse(await req.json());

    const ticket = await createTicket(
      ctx.environment,
      {
        customer: { external_id: ctx.externalId, email: ctx.user.email, name: ctx.user.fullName || ctx.user.email },
        subject: data.subject,
        body: data.message,
        category: data.category,
        priority: "normal",
        fields: { source: "partner_portal", customer_type: "partner" },
      },
      portalIdempotencyKey(ctx.user.id, req.headers.get("idempotency-key"))
    );
    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    if (error instanceof CrmApiError) {
      console.error("[crymad-crm] Creating a ticket failed", error);
      return unavailable();
    }
    return handleApiError(error);
  }
}
