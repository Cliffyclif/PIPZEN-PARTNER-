import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AccentColor = "amber" | "emerald" | "sky" | "purple" | "rose";

const iconColors: Record<AccentColor, string> = {
  amber:   "bg-amber-500/15 text-amber-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  sky:     "bg-sky-500/15 text-sky-400",
  purple:  "bg-purple-500/15 text-purple-400",
  rose:    "bg-rose-500/15 text-rose-400",
};

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  icon?: LucideIcon;
  color?: AccentColor;
}

export function PageHeader({ title, description, children, icon: Icon, color }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && color && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconColors[color])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
