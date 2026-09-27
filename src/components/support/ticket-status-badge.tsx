import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  new: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  open: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  waiting_on_customer: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  on_hold: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  solved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export function isTicketClosed(status: string) {
  return status.toLowerCase() === "closed";
}

export function TicketStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium capitalize", styles[key] || "bg-slate-500/10 text-slate-300 border-slate-500/20")}
    >
      {key.replace(/_/g, " ")}
    </Badge>
  );
}
