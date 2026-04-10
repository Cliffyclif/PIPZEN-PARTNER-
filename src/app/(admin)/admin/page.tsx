import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Users, ShoppingCart, DollarSign, Wallet, UserCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    totalPartners,
    activePartners,
    totalPurchases,
    purchaseSum,
    commissionSum,
    pendingWithdrawals,
    withdrawalSum,
    recentPartners,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "PARTNER" } }),
    prisma.user.count({ where: { role: "PARTNER", status: "ACTIVE" } }),
    prisma.purchase.count(),
    prisma.purchase.aggregate({ _sum: { amount: true } }),
    prisma.commission.aggregate({ _sum: { commissionAmount: true } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.withdrawal.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
    prisma.user.findMany({
      where: { role: "PARTNER" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, email: true, status: true, createdAt: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Admin Dashboard" description="Overview of your partner platform" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Partners"
          value={totalPartners.toString()}
          icon={Users}
        />
        <StatsCard
          title="Active Partners"
          value={activePartners.toString()}
          icon={UserCheck}
        />
        <StatsCard
          title="Total Purchases"
          value={formatCurrency(Number(purchaseSum._sum.amount ?? 0))}
          description={`${totalPurchases} purchases`}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Total Commissions"
          value={formatCurrency(Number(commissionSum._sum.commissionAmount ?? 0))}
          icon={DollarSign}
        />
        <StatsCard
          title="Pending Withdrawals"
          value={pendingWithdrawals.toString()}
          description={formatCurrency(Number(withdrawalSum._sum.amount ?? 0))}
          icon={Wallet}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Partners</h2>
        {recentPartners.length === 0 ? (
          <p className="text-slate-400 text-sm">No partners yet. Start by inviting partners.</p>
        ) : (
          <div className="space-y-3">
            {recentPartners.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{p.fullName || "Pending"}</p>
                  <p className="text-xs text-slate-400">{p.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  p.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" :
                  p.status === "INVITED" ? "bg-sky-500/10 text-sky-400" :
                  "bg-red-500/10 text-red-400"
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
