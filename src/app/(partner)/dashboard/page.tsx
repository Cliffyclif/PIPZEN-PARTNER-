import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getPartnerBalance } from "@/lib/commission-engine";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Users, DollarSign, Wallet, BadgeCheck, Network, Trophy, Megaphone, Link2, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export const dynamic = "force-dynamic";

const levelColors: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-amber-500/15", text: "text-amber-400" },
  2: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  3: { bg: "bg-sky-500/15", text: "text-sky-400" },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getNextMilestone(current: number): { target: number; remaining: number } {
  const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];
  const target = milestones.find((m) => m > current) || current + 100;
  return { target, remaining: target - current };
}

export default async function PartnerDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [
    balance,
    referralCount,
    badgeCount,
    activeCampaigns,
    user,
    recentCommissions,
  ] = await Promise.all([
    getPartnerBalance(userId),
    prisma.user.count({ where: { referrerId: userId } }),
    prisma.badgeAward.count({ where: { userId } }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, pipzenReferralLink: true },
    }),
    prisma.commission.findMany({
      where: { earnerId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { buyer: { select: { fullName: true, email: true } } },
    }),
  ]);

  const referralLink = user?.pipzenReferralLink || null;
  const milestone = getNextMilestone(referralCount);
  const milestoneProgress = Math.round(((milestone.target - milestone.remaining) / milestone.target) * 100);
  const firstName = user?.fullName?.split(" ")[0] || "Partner";

  return (
    <div className="space-y-6">
      {/* ─── Hero Greeting Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-800 to-purple-500/15 border border-slate-700/50 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="relative">
          <p className="text-sm text-amber-400 font-medium mb-1">{getGreeting()}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-slate-400 text-sm max-w-md">
            {recentCommissions.length > 0
              ? "Your network is growing. Keep sharing and earning!"
              : "Share your referral link to start building your network and earning commissions."}
          </p>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Referrals" value={referralCount.toString()} icon={Users} color="amber" />
        <StatsCard title="Total Earned" value={formatCurrency(balance.totalEarned)} icon={DollarSign} color="emerald" />
        <StatsCard
          title="Available Balance"
          value={formatCurrency(balance.availableBalance)}
          description={`${formatCurrency(balance.pendingEarnings)} pending`}
          icon={Wallet}
          color="sky"
        />
        <StatsCard title="Badges Earned" value={badgeCount.toString()} icon={BadgeCheck} color="purple" />
      </div>

      {/* ─── Milestone + Referral Link Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Milestone */}
        <Card className="bg-slate-800/50 border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-purple-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              Next Milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-white">{referralCount}</span>
              <span className="text-slate-400 text-sm">/ {milestone.target} referrals</span>
            </div>
            <Progress value={milestoneProgress} className="h-2.5 mb-2" />
            <p className="text-xs text-slate-400">
              {milestone.remaining === 0
                ? "Milestone reached! Keep going!"
                : `${milestone.remaining} more referral${milestone.remaining === 1 ? "" : "s"} to hit ${milestone.target}!`}
            </p>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <Card className="bg-slate-800/50 border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-sky-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Link2 className="h-4 w-4 text-emerald-400" />
              </div>
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referralLink ? (
              <>
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-3 border border-slate-700/50">
                  <code className="text-sm text-amber-400 flex-1 truncate">{referralLink}</code>
                  <CopyButton text={referralLink} />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Share this link to grow your network and earn commissions
                </p>
              </>
            ) : (
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-400">Your referral link hasn&apos;t been set up yet.</p>
                <p className="text-xs text-slate-500 mt-1">Contact admin to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Commissions ─── */}
      <Card className="bg-slate-800/50 border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            Recent Commissions
          </CardTitle>
          <Link href="/earnings" className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentCommissions.length === 0 ? (
            <div className="py-8 text-center">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No commissions yet.</p>
              <p className="text-xs text-slate-500 mt-1">Share your referral link to start earning!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCommissions.map((c) => {
                const lc = levelColors[c.level] || levelColors[3];
                return (
                  <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lc.bg} ${lc.text}`}>
                        L{c.level}
                      </span>
                      <div>
                        <p className="text-sm text-white">{c.buyer.fullName || c.buyer.email}</p>
                        <p className="text-xs text-slate-500">{Number(c.rate)}% commission</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">
                      +{formatCurrency(Number(c.commissionAmount))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Quick Actions ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "View Network", href: "/network", icon: Network, gradient: "from-sky-500/15 to-sky-500/5", iconColor: "text-sky-400", borderColor: "border-sky-500/20" },
          { label: "Leaderboard", href: "/leaderboard", icon: Trophy, gradient: "from-amber-500/15 to-amber-500/5", iconColor: "text-amber-400", borderColor: "border-amber-500/20" },
          { label: "Marketing Kit", href: "/marketing", icon: Megaphone, gradient: "from-rose-500/15 to-rose-500/5", iconColor: "text-rose-400", borderColor: "border-rose-500/20" },
          { label: "Campaigns", href: "/campaigns", icon: Trophy, gradient: "from-purple-500/15 to-purple-500/5", iconColor: "text-purple-400", borderColor: "border-purple-500/20" },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <div className={`bg-gradient-to-br ${action.gradient} border ${action.borderColor} rounded-xl p-4 text-center hover:scale-[1.02] transition-transform cursor-pointer`}>
              <action.icon className={`w-6 h-6 ${action.iconColor} mx-auto mb-2`} />
              <p className="text-xs font-medium text-slate-300">{action.label}</p>
              {action.label === "Campaigns" && activeCampaigns > 0 && (
                <p className="text-[10px] text-amber-400 mt-1">{activeCampaigns} active</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
