import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BadgesClient } from "./badges-client";

export const dynamic = "force-dynamic";

export default async function AdminBadgesPage() {
  const badges = await prisma.badge.findMany({
    orderBy: { referralThreshold: "asc" },
    include: { _count: { select: { awards: true } } },
  });

  const serialized = badges.map((b) => ({
    ...b,
    rewardAmount: Number(b.rewardAmount),
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader title="Badges" description="Create and manage badge milestones and rewards for partners" />
      <BadgesClient initialBadges={serialized} />
    </div>
  );
}
