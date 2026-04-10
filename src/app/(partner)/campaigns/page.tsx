import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Trophy, Sparkles, Star, Flame, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

function getProgressStyle(progress: number) {
  if (progress >= 100) return { badge: "Completed!", badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", glow: "from-emerald-500/15 to-emerald-500/5", stripe: "from-emerald-400 to-emerald-500", icon: Sparkles };
  if (progress >= 90) return { badge: "Almost there!", badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/20", glow: "from-amber-500/15 to-amber-500/5", stripe: "from-amber-400 to-amber-500", icon: Flame };
  if (progress >= 75) return { badge: "On fire!", badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/20", glow: "from-orange-500/15 to-orange-500/5", stripe: "from-orange-400 to-orange-500", icon: Star };
  return { badge: null, badgeBg: "", glow: "from-purple-500/10 to-purple-500/5", stripe: "from-purple-400 to-purple-500", icon: Trophy };
}

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    orderBy: { endDate: "asc" },
  });

  const referralCount = await prisma.user.count({ where: { referrerId: session.user.id } });
  const totalEarnings = await prisma.commission.aggregate({
    where: { earnerId: session.user.id, status: "PAID" },
    _sum: { commissionAmount: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Campaigns" description="Participate in campaigns to earn rewards" icon={Trophy} color="amber" />

      {campaigns.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-lg font-medium text-white mb-1">No Active Campaigns</p>
            <p className="text-sm text-slate-400">Check back soon — new campaigns are launched regularly!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const currentValue = c.goalType === "REFERRAL_COUNT"
              ? referralCount
              : Number(totalEarnings._sum.commissionAmount ?? 0);
            const goalValue = Number(c.goalValue);
            const progress = Math.min((currentValue / goalValue) * 100, 100);
            const style = getProgressStyle(progress);
            const ProgressIcon = style.icon;

            return (
              <Card key={c.id} className={`bg-gradient-to-br ${style.glow} border-slate-700 relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.stripe}`} />

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <ProgressIcon className="w-4.5 h-4.5 text-amber-400" />
                      </div>
                      <CardTitle className="text-white text-base">{c.title}</CardTitle>
                    </div>
                    {style.badge && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${style.badgeBg}`}>
                        {style.badge}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {c.description && <p className="text-sm text-slate-400">{c.description}</p>}

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">
                        {c.goalType === "REFERRAL_COUNT"
                          ? `${currentValue} / ${goalValue} referrals`
                          : `${formatCurrency(currentValue)} / ${formatCurrency(goalValue)}`
                        }
                      </span>
                      <span className={progress >= 90 ? "text-amber-400 font-bold" : "text-amber-400"}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2.5" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(Number(c.rewardAmount))}</span>
                      <span className="text-xs text-slate-500">reward</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      Ends {formatDate(c.endDate)}
                    </div>
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
