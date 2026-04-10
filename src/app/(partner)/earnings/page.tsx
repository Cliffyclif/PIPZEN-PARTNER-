import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const levelConfig: Record<string, { gradient: string; stripe: string; text: string; pillBg: string; pillText: string }> = {
  "Level 1": { gradient: "from-amber-500/15 to-amber-500/5", stripe: "from-amber-400 to-amber-500", text: "text-amber-400", pillBg: "bg-amber-500/15", pillText: "text-amber-400" },
  "Level 2": { gradient: "from-emerald-500/15 to-emerald-500/5", stripe: "from-emerald-400 to-emerald-500", text: "text-emerald-400", pillBg: "bg-emerald-500/15", pillText: "text-emerald-400" },
  "Level 3": { gradient: "from-sky-500/15 to-sky-500/5", stripe: "from-sky-400 to-sky-500", text: "text-sky-400", pillBg: "bg-sky-500/15", pillText: "text-sky-400" },
};

const defaultLevelConfig = levelConfig["Level 3"];

export default async function EarningsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const commissions = await prisma.commission.findMany({
    where: { earnerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { fullName: true, email: true } },
      purchase: { select: { packageName: true, amount: true } },
    },
  });

  const byLevel = commissions.reduce((acc, c) => {
    const level = c.level <= 3 ? `Level ${c.level}` : "Level 3";
    acc[level] = (acc[level] || 0) + Number(c.commissionAmount);
    return acc;
  }, {} as Record<string, number>);

  const totalEarned = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Earnings" description="Your commission breakdown" icon={DollarSign} color="emerald" />

      {/* ─── Hero Earnings Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/15 via-slate-800 to-emerald-500/5 border border-emerald-500/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <p className="text-sm text-emerald-400 font-medium mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Total Earnings
          </p>
          <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            {formatCurrency(totalEarned)}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            From {commissions.length} commission{commissions.length !== 1 ? "s" : ""} across your network
          </p>
        </div>
      </div>

      {/* ─── Level Breakdown Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["Level 1", "Level 2", "Level 3"] as const).map((level) => {
          const amount = byLevel[level] || 0;
          const config = levelConfig[level];
          const rate = level === "Level 1" ? "6%" : level === "Level 2" ? "3%" : "1%";
          return (
            <Card key={level} className={`bg-gradient-to-br ${config.gradient} border-slate-700 relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.stripe}`} />
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400">{level}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.pillBg} ${config.pillText}`}>{rate}</span>
                </div>
                <p className={`text-2xl font-bold ${config.text}`}>{formatCurrency(amount)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Commission History Table ─── */}
      <Card className="bg-slate-800/50 border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
        <CardHeader>
          <CardTitle className="text-white">Commission History</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No commissions yet. Share your referral link to start earning!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">From</TableHead>
                  <TableHead className="text-slate-400">Package</TableHead>
                  <TableHead className="text-slate-400">Level</TableHead>
                  <TableHead className="text-slate-400">Rate</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => {
                  const levelKey = c.level <= 3 ? `Level ${c.level}` : "Level 3";
                  const lc = levelConfig[levelKey] || defaultLevelConfig;
                  return (
                    <TableRow key={c.id} className="border-slate-700">
                      <TableCell className="text-sm text-white">
                        {c.buyer.fullName || c.buyer.email}
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">{c.purchase.packageName}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lc.pillBg} ${lc.pillText}`}>
                          L{c.level}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">{Number(c.rate)}%</TableCell>
                      <TableCell className="text-sm font-medium text-emerald-400">
                        {formatCurrency(Number(c.commissionAmount))}
                      </TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-sm text-slate-400">{formatDate(c.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
