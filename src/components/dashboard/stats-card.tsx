import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AccentColor = "amber" | "emerald" | "sky" | "purple" | "rose";

const colorConfig: Record<AccentColor, { icon: string; stripe: string; bg: string; glow: string }> = {
  amber:   { icon: "bg-amber-500/15 text-amber-400",   stripe: "from-amber-400 to-amber-500",   bg: "hover:shadow-amber-500/5",   glow: "group-hover:bg-amber-500/5" },
  emerald: { icon: "bg-emerald-500/15 text-emerald-400", stripe: "from-emerald-400 to-emerald-500", bg: "hover:shadow-emerald-500/5", glow: "group-hover:bg-emerald-500/5" },
  sky:     { icon: "bg-sky-500/15 text-sky-400",       stripe: "from-sky-400 to-sky-500",       bg: "hover:shadow-sky-500/5",     glow: "group-hover:bg-sky-500/5" },
  purple:  { icon: "bg-purple-500/15 text-purple-400", stripe: "from-purple-400 to-purple-500", bg: "hover:shadow-purple-500/5",  glow: "group-hover:bg-purple-500/5" },
  rose:    { icon: "bg-rose-500/15 text-rose-400",     stripe: "from-rose-400 to-rose-500",     bg: "hover:shadow-rose-500/5",    glow: "group-hover:bg-rose-500/5" },
};

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
  color?: AccentColor;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  color,
}: StatsCardProps) {
  const c = color ? colorConfig[color] : null;

  // Original admin-style card (no color)
  if (!c) {
    return (
      <Card className={cn("bg-slate-800/50 border-slate-700", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
          <Icon className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{value}</div>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
          {trend && (
            <p className={cn("text-xs mt-1", trend.positive ? "text-emerald-400" : "text-red-400")}>
              {trend.positive ? "+" : ""}{trend.value}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Vibrant partner-style card
  return (
    <Card className={cn(
      "bg-slate-800/50 border-slate-700 relative overflow-hidden group transition-shadow duration-300",
      c.bg,
      className,
    )}>
      {/* Gradient top stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.stripe}`} />

      {/* Subtle hover glow */}
      <div className={cn("absolute inset-0 transition-colors duration-300", c.glow)} />

      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        {trend && (
          <p className={cn("text-xs mt-1 font-medium", trend.positive ? "text-emerald-400" : "text-red-400")}>
            {trend.positive ? "+" : ""}{trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
