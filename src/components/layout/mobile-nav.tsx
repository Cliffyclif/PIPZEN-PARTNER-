"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PARTNER_NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/lib/constants";

const navColors: Record<string, { active: string; icon: string }> = {
  amber:   { active: "bg-amber-500/10 text-amber-400",   icon: "text-amber-400" },
  emerald: { active: "bg-emerald-500/10 text-emerald-400", icon: "text-emerald-400" },
  sky:     { active: "bg-sky-500/10 text-sky-400",       icon: "text-sky-400" },
  purple:  { active: "bg-purple-500/10 text-purple-400", icon: "text-purple-400" },
  rose:    { active: "bg-rose-500/10 text-rose-400",     icon: "text-rose-400" },
  slate:   { active: "bg-slate-700/50 text-slate-300",   icon: "text-slate-400" },
};

interface MobileNavProps {
  variant: "partner" | "admin";
}

export function MobileNav({ variant }: MobileNavProps) {
  const pathname = usePathname();
  const items = variant === "admin" ? ADMIN_NAV_ITEMS : PARTNER_NAV_ITEMS;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-800">
        <Image src="/logo.png" alt="PipZen" width={32} height={32} className="rounded-lg" />
        <span className="text-lg font-bold text-white">PipZen</span>
        <span
          className={cn(
            "text-xs font-medium ml-1",
            variant === "admin" ? "text-red-400" : "text-amber-400"
          )}
        >
          {variant === "admin" ? "Admin" : "Partners"}
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive =
            variant === "admin" && item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const itemColor = "color" in item ? navColors[(item as { color: string }).color] : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? (itemColor?.active || "bg-amber-500/10 text-amber-400")
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className={cn("w-5 h-5", !isActive && itemColor?.icon)} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
