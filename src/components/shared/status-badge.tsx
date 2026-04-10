import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INVITED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  BANNED: "bg-red-500/10 text-red-400 border-red-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ENDED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        statusStyles[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20",
        className
      )}
    >
      {status}
    </Badge>
  );
}
