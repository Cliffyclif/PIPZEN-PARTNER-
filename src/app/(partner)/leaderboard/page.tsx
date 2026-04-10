import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { Trophy, Users, DollarSign, Medal } from "lucide-react";

export const dynamic = "force-dynamic";

const podiumConfig = [
  { place: 2, height: "h-20", bg: "from-slate-400/20 to-slate-400/5", border: "border-slate-400/30", medal: "text-slate-300", label: "2nd" },
  { place: 1, height: "h-28", bg: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/30", medal: "text-amber-400", label: "1st" },
  { place: 3, height: "h-16", bg: "from-orange-500/20 to-orange-500/5", border: "border-orange-500/30", medal: "text-orange-400", label: "3rd" },
];

function Podium({ top3 }: { top3: { name: string; value: string }[] }) {
  if (top3.length < 3) return null;

  // Reorder: [2nd, 1st, 3rd] for visual podium
  const ordered = [top3[1], top3[0], top3[2]];

  return (
    <div className="flex items-end justify-center gap-3 mb-8 pt-4">
      {ordered.map((entry, visualIdx) => {
        const config = podiumConfig[visualIdx];
        const initials = entry.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div key={config.place} className="flex flex-col items-center">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.bg} border ${config.border} flex items-center justify-center mb-2`}>
              <span className={`text-sm font-bold ${config.medal}`}>{initials}</span>
            </div>
            {/* Name */}
            <p className="text-xs text-white font-medium text-center truncate max-w-[90px] mb-1">{entry.name}</p>
            {/* Value */}
            <p className={`text-xs font-semibold ${config.medal} mb-2`}>{entry.value}</p>
            {/* Podium block */}
            <div className={`w-24 ${config.height} bg-gradient-to-t ${config.bg} border ${config.border} rounded-t-lg flex items-center justify-center`}>
              <span className={`text-lg font-bold ${config.medal}`}>{config.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function LeaderboardPage() {
  const topEarners = await prisma.commission.groupBy({
    by: ["earnerId"],
    where: { status: "PAID" },
    _sum: { commissionAmount: true },
    orderBy: { _sum: { commissionAmount: "desc" } },
    take: 10,
  });

  const earnerIds = topEarners.map((e) => e.earnerId);
  const earnerUsers = await prisma.user.findMany({
    where: { id: { in: earnerIds } },
    select: { id: true, fullName: true, email: true },
  });
  const earnerMap = new Map(earnerUsers.map((u) => [u.id, u]));

  const topReferrers = await prisma.user.findMany({
    where: { role: "PARTNER", status: "ACTIVE" },
    select: {
      id: true,
      fullName: true,
      email: true,
      _count: { select: { referrals: true } },
    },
    orderBy: { referrals: { _count: "desc" } },
    take: 10,
  });

  // Prepare podium data
  const earnerPodium = topEarners.slice(0, 3).map((e) => {
    const user = earnerMap.get(e.earnerId);
    return { name: user?.fullName || user?.email || "Unknown", value: formatCurrency(Number(e._sum.commissionAmount ?? 0)) };
  });

  const referrerPodium = topReferrers.slice(0, 3).map((u) => ({
    name: u.fullName || u.email,
    value: `${u._count.referrals} referrals`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Leaderboard" description="See who's leading the network" icon={Medal} color="amber" />

      <Tabs defaultValue="earners">
        <TabsList className="bg-slate-800 mb-6">
          <TabsTrigger value="earners" className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
            <DollarSign className="w-4 h-4 mr-2" /> Top Earners
          </TabsTrigger>
          <TabsTrigger value="referrers" className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-400">
            <Users className="w-4 h-4 mr-2" /> Most Referrals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earners">
          <Card className="bg-slate-800/50 border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
            <CardContent className="pt-6">
              {/* Podium for top 3 */}
              <Podium top3={earnerPodium} />

              {/* Rest of the list */}
              {topEarners.length > 3 && (
                <div className="space-y-2">
                  {topEarners.slice(3).map((e, i) => {
                    const user = earnerMap.get(e.earnerId);
                    const rank = i + 4;
                    return (
                      <div key={e.earnerId} className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-slate-700/30 transition-colors">
                        <span className="text-sm font-bold w-8 text-center text-slate-500">#{rank}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{user?.fullName || user?.email || "Unknown"}</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">
                          {formatCurrency(Number(e._sum.commissionAmount ?? 0))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {topEarners.length === 0 && (
                <div className="py-12 text-center">
                  <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No earnings data yet. Be the first!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrers">
          <Card className="bg-slate-800/50 border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-sky-500" />
            <CardContent className="pt-6">
              {/* Podium for top 3 */}
              <Podium top3={referrerPodium} />

              {/* Rest of the list */}
              {topReferrers.length > 3 && (
                <div className="space-y-2">
                  {topReferrers.slice(3).map((u, i) => {
                    const rank = i + 4;
                    return (
                      <div key={u.id} className="flex items-center gap-4 py-3 px-3 rounded-lg hover:bg-slate-700/30 transition-colors">
                        <span className="text-sm font-bold w-8 text-center text-slate-500">#{rank}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{u.fullName || u.email}</p>
                        </div>
                        <span className="text-sm font-semibold text-sky-400">{u._count.referrals} referrals</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {topReferrers.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No referral data yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
