"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { newIdempotencyKey } from "@/lib/crymad-crm/text";
import { Loader2, Send } from "lucide-react";

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const draftKey = useRef(newIdempotencyKey());

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/partner/support/tickets/${encodeURIComponent(ticketId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": draftKey.current },
        body: JSON.stringify({ message }),
      });
      const result = await res.json();
      if (!res.ok) {
        const description = typeof result.error === "string" ? result.error : "Your reply was not sent. Please try again.";
        toast({ title: "Not sent", description, variant: "destructive" });
        return;
      }
      draftKey.current = newIdempotencyKey();
      setMessage("");
      router.refresh();
    } catch {
      toast({ title: "Not sent", description: "Your reply was not sent. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={send} className="space-y-3">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write a reply..."
        rows={4}
        maxLength={5000}
        className="bg-slate-900 border-slate-700 text-white"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={sending || !message.trim()} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send reply
        </Button>
      </div>
    </form>
  );
}
