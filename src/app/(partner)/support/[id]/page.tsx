import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-guard";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatusBadge, isTicketClosed } from "@/components/support/ticket-status-badge";
import { getOwnedTicket, getPartnerSupportContext } from "@/lib/crymad-crm/partner-support";
import { htmlToPlainText, safeDecode } from "@/lib/crymad-crm/text";
import type { TicketDetail } from "@/lib/crymad-crm/client";
import { cn, formatDateTime } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { TicketReplyForm } from "./ticket-reply-form";

export const dynamic = "force-dynamic";

export default async function SupportTicketPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getPartnerSupportContext(session.user.id);
  if (!ctx) redirect("/login");
  if (!ctx.configured) redirect("/support");

  let ticket: TicketDetail | null = null;
  let loadError = false;
  try {
    ticket = await getOwnedTicket(ctx.environment, safeDecode(params.id), ctx.externalId);
  } catch (error) {
    console.error("[crymad-crm] Loading a ticket failed", error);
    loadError = true;
  }
  if (!ticket && !loadError) notFound();

  return (
    <div className="space-y-6">
      <Link href="/support" className="inline-flex items-center text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="mr-1 h-4 w-4" /> All tickets
      </Link>

      {!ticket ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center text-sm text-slate-400">
            We couldn&apos;t load this ticket right now. Please refresh in a moment.
          </CardContent>
        </Card>
      ) : (
        <>
          <PageHeader
            title={ticket.subject}
            description={ticket.number ? `Ticket #${ticket.number}` : undefined}
          >
            <TicketStatusBadge status={ticket.status} />
          </PageHeader>

          <div className="space-y-3">
            {ticket.messages.length === 0 && (
              <p className="text-sm text-slate-400">No messages yet.</p>
            )}
            {ticket.messages.map((m) => (
              <div key={m.id} className={cn("flex", m.fromCustomer ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl border px-4 py-3",
                    m.fromCustomer
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-slate-800/70 border-slate-700"
                  )}
                >
                  <p className="text-xs font-medium text-slate-400 mb-1">
                    {m.fromCustomer ? "You" : m.authorName || "Pipzen Support"}
                    {m.createdAt && <span className="ml-2 text-slate-500">{formatDateTime(m.createdAt)}</span>}
                  </p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">{htmlToPlainText(m.body)}</p>
                </div>
              </div>
            ))}
          </div>

          {isTicketClosed(ticket.status) ? (
            <p className="text-sm text-slate-400">
              This ticket is closed. <Link href="/support" className="text-amber-400 hover:underline">Open a new ticket</Link> if you still need help.
            </p>
          ) : (
            <TicketReplyForm ticketId={ticket.id} />
          )}
        </>
      )}
    </div>
  );
}
