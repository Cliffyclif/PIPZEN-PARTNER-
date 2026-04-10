"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, DollarSign, UserPlus, Trophy, AlertCircle, MessageSquare, Wallet } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Bell> = {
  NEW_REFERRAL: UserPlus,
  COMMISSION_EARNED: DollarSign,
  WITHDRAWAL_UPDATE: Wallet,
  BADGE_EARNED: Trophy,
  CAMPAIGN_UPDATE: Trophy,
  SYSTEM: AlertCircle,
  MESSAGE: MessageSquare,
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    router.refresh();
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    router.refresh();
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={markAllRead}
            className="border-slate-700 text-slate-300"
          >
            Mark all as read ({unreadCount})
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <Card
                key={n.id}
                className={cn(
                  "bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors",
                  !n.isRead && "border-l-2 border-l-amber-500"
                )}
                onClick={() => !n.isRead && markRead(n.id)}
              >
                <CardContent className="flex items-start gap-4 py-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    !n.isRead ? "bg-amber-500/10" : "bg-slate-700"
                  )}>
                    <Icon className={cn("w-5 h-5", !n.isRead ? "text-amber-400" : "text-slate-400")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", !n.isRead ? "text-white" : "text-slate-300")}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
