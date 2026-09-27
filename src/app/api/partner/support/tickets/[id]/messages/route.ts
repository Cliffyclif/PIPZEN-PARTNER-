import { NextResponse } from "next/server";
import { requirePartner, handleApiError } from "@/lib/auth-guard";
import { CrmApiError, addTicketMessage } from "@/lib/crymad-crm/client";
import { getOwnedTicket, getPartnerSupportContext, portalIdempotencyKey } from "@/lib/crymad-crm/partner-support";
import { safeDecode } from "@/lib/crymad-crm/text";
import { supportReplySchema } from "@/lib/validations/support";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Adds the partner's reply to one of their own tickets.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requirePartner();
    const ctx = await getPartnerSupportContext(session.user.id);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!ctx.configured) {
      return NextResponse.json({ error: "Support is temporarily unavailable" }, { status: 503 });
    }
    const { message } = supportReplySchema.parse(await req.json());

    const ticket = await getOwnedTicket(ctx.environment, safeDecode(params.id), ctx.externalId);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    await addTicketMessage(
      ctx.environment,
      ticket.id,
      {
        customer: { external_id: ctx.externalId, email: ctx.user.email, name: ctx.user.fullName || ctx.user.email },
        body: message,
      },
      portalIdempotencyKey(ctx.user.id, req.headers.get("idempotency-key"))
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    if (error instanceof CrmApiError) {
      console.error("[crymad-crm] Replying to a ticket failed", error);
      const closed = error.status === 409 || error.status === 422;
      return NextResponse.json(
        {
          error: closed
            ? "This ticket can no longer be replied to. Please open a new ticket."
            : "Support is temporarily unavailable",
        },
        { status: closed ? 409 : 503 }
      );
    }
    return handleApiError(error);
  }
}
