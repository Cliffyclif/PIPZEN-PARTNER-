"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PARTNER_NAV_ITEMS } from "@/lib/constants";

const navColors: Record<string, { active: string; icon: string; border: string }> = {
  amber:   { active: "bg-amber-500/10 text-amber-400",   icon: "text-amber-400",   border: "border-l-amber-400" },
  emerald: { active: "bg-emerald-500/10 text-emerald-400", icon: "text-emerald-400", border: "border-l-emerald-400" },
  sky:     { active: "bg-sky-500/10 text-sky-400",       icon: "text-sky-400",     border: "border-l-sky-400" },
  purple:  { active: "bg-purple-500/10 text-purple-400", icon: "text-purple-400",  border: "border-l-purple-400" },
  rose:    { active: "bg-rose-500/10 text-rose-400",     icon: "text-rose-400",    border: "border-l-rose-400" },
  slate:   { active: "bg-slate-700/50 text-slate-300",   icon: "text-slate-400",   border: "border-l-slate-400" },
};

export function PartnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30 bg-slate-900 border-r border-slate-800">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-800">
        <Image src="/logo.png" alt="PipZen" width={32} height={32} className="rounded-lg" />
        <span className="text-lg font-bold text-white">PipZen</span>
        <span className="text-xs text-amber-400 font-medium ml-1">Partners</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {PARTNER_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const c = navColors[item.color] || navColors.amber;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? cn(c.active, "border-l-2", c.border)
                  : "text-slate-400 hover:text-white hover:bg-slate-800 border-l-2 border-l-transparent"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "" : c.icon)} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Branding footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/10">
          <p className="text-[10px] uppercase tracking-wider text-amber-400/70 font-semibold">Partner Program</p>
          <p className="text-xs text-slate-400 mt-0.5">6% / 3% / 1% commissions</p>
        </div>
      </div>
    </aside>
  );
}
