"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TicketStatusBadge } from "@/components/support/ticket-status-badge";
import { openCrmChat } from "@/components/support/crm-widget";
import { useToast } from "@/hooks/use-toast";
import { SUPPORT_CATEGORIES } from "@/lib/constants";
import { newIdempotencyKey } from "@/lib/crymad-crm/text";
import { formatDateTime } from "@/lib/utils";
import { LifeBuoy, Loader2, MessageCircle, Plus } from "lucide-react";

interface Ticket {
  id: string;
  number: string | null;
  subject: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

interface SupportClientProps {
  configured: boolean;
  chatEnabled: boolean;
  loadError: boolean;
  initialTickets: Ticket[];
  initialCursor: string | null;
}

function errorMessage(result: { error?: unknown }) {
  if (typeof result.error === "string") return result.error;
  if (Array.isArray(result.error) && result.error[0]?.message) return String(result.error[0].message);
  return "Something went wrong. Please try again.";
}

export function SupportClient({ configured, chatEnabled, loadError, initialTickets, initialCursor }: SupportClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tickets, setTickets] = useState(initialTickets);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>(SUPPORT_CATEGORIES[0].value);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // One key per draft, so a double click or retry never opens two tickets.
  const draftKey = useRef(newIdempotencyKey());

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/partner/support/tickets?cursor=${encodeURIComponent(cursor)}`);
      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: errorMessage(result), variant: "destructive" });
        return;
      }
      setTickets((prev) => [...prev, ...result.tickets]);
      setCursor(result.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/partner/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": draftKey.current },
        body: JSON.stringify({ subject, category, message }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Could not send", description: errorMessage(result), variant: "destructive" });
        return;
      }
      toast({
        title: "Ticket created",
        description: result.ticket?.number ? `Ticket #${result.ticket.number} is with Pipzen Support.` : "Pipzen Support will reply soon.",
      });
      draftKey.current = newIdempotencyKey();
      setSubject("");
      setMessage("");
      setOpen(false);
      if (result.ticket?.id) router.push(`/support/${encodeURIComponent(result.ticket.id)}`);
      else router.refresh();
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12 text-center">
          <LifeBuoy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300">Need help? Email Pipzen Support at</p>
          <a href="mailto:support@pipzen.io" className="text-amber-400 hover:underline">support@pipzen.io</a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        {chatEnabled && (
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300"
            onClick={() => {
              if (!openCrmChat()) {
                toast({ title: "Chat is loading", description: "Please try again in a moment." });
              }
            }}
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Chat with us
          </Button>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              <Plus className="mr-2 h-4 w-4" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">New Support Ticket</DialogTitle>
              <DialogDescription className="text-slate-400">
                Pipzen Support will reply here and by email.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitTicket} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Topic</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {SUPPORT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-slate-200">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-subject" className="text-slate-300">Subject</Label>
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  minLength={3}
                  maxLength={150}
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-message" className="text-slate-300">How can we help?</Label>
                <Textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  minLength={10}
                  maxLength={5000}
                  rows={6}
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send to Support
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Your Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="py-8 text-center text-sm text-slate-400">
              We couldn&apos;t load your tickets right now. Please refresh in a moment.
            </p>
          ) : tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No support tickets yet.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Ticket</TableHead>
                    <TableHead className="text-slate-400">Subject</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Last update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id} className="border-slate-700">
                      <TableCell className="text-sm text-slate-400">{t.number ? `#${t.number}` : "-"}</TableCell>
                      <TableCell className="text-sm font-medium">
                        <Link href={`/support/${encodeURIComponent(t.id)}`} className="text-white hover:text-amber-400">
                          {t.subject}
                        </Link>
                      </TableCell>
                      <TableCell><TicketStatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {t.updatedAt ? formatDateTime(t.updatedAt) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {cursor && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="border-slate-700 text-slate-300">
                    {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
