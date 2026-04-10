import { prisma } from "./prisma";

interface CommissionResult {
  earnerId: string;
  buyerId: string;
  level: number;
  rate: number;
  amount: number;
}

export async function calculateCommissions(
  buyerId: string,
  purchaseAmount: number
): Promise<CommissionResult[]> {
  // Fetch configurable rates from settings table
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ["commission_level_1", "commission_level_2", "commission_level_3_plus"] },
    },
  });

  const rateMap: Record<string, number> = {
    commission_level_1: 6,
    commission_level_2: 3,
    commission_level_3_plus: 1,
  };

  for (const s of settings) {
    rateMap[s.key] = parseFloat(s.value);
  }

  const commissions: CommissionResult[] = [];

  // Walk UP the referral tree iteratively
  let currentUserId = buyerId;
  let level = 0;

  while (true) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { referrerId: true },
    });

    if (!currentUser?.referrerId) break;

    level++;

    const referrer = await prisma.user.findUnique({
      where: { id: currentUser.referrerId },
      select: { id: true, status: true, role: true },
    });

    // Skip banned users, continue walking up
    if (!referrer || referrer.status === "BANNED") {
      currentUserId = currentUser.referrerId;
      continue;
    }

    // Stop at admin (root of tree)
    if (referrer.role === "ADMIN") break;

    let rate: number;
    if (level === 1) rate = rateMap.commission_level_1;
    else if (level === 2) rate = rateMap.commission_level_2;
    else rate = rateMap.commission_level_3_plus;

    const amount = Math.round((purchaseAmount * rate) / 100 * 100) / 100;

    commissions.push({
      earnerId: referrer.id,
      buyerId,
      level,
      rate,
      amount,
    });

    currentUserId = currentUser.referrerId;
  }

  return commissions;
}

export async function seedPurchaseWithCommissions(data: {
  userId: string;
  amount: number;
  packageName: string;
  packageType: "INSTANT_FUNDING" | "EVALUATION";
  seededById: string;
}) {
  const commissions = await calculateCommissions(data.userId, data.amount);

  // Check auto-approve setting
  const autoApproveSetting = await prisma.setting.findUnique({
    where: { key: "commission_auto_approve" },
  });
  const autoApprove = autoApproveSetting?.value === "true";

  return prisma.$transaction(async (tx) => {
    // Create the purchase
    const purchase = await tx.purchase.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        packageName: data.packageName,
        packageType: data.packageType,
        seededById: data.seededById,
      },
    });

    // Create all commission records
    if (commissions.length > 0) {
      await tx.commission.createMany({
        data: commissions.map((c) => ({
          purchaseId: purchase.id,
          earnerId: c.earnerId,
          buyerId: c.buyerId,
          level: c.level,
          rate: c.rate,
          commissionAmount: c.amount,
          status: autoApprove ? "PAID" : "PENDING",
        })),
      });
    }

    // Create notifications for each earner
    for (const c of commissions) {
      await tx.notification.create({
        data: {
          userId: c.earnerId,
          type: "COMMISSION_EARNED",
          title: "New Commission Earned!",
          message: `You earned $${c.amount.toFixed(2)} (${c.rate}%) from a Level ${c.level} referral purchase.`,
          data: { purchaseId: purchase.id, amount: c.amount },
        },
      });
    }

    // Check badge eligibility for direct referrer
    await checkBadgeEligibility(tx, commissions);

    return { purchase, commissions };
  });
}

async function checkBadgeEligibility(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  commissions: CommissionResult[]
) {
  for (const c of commissions) {
    if (c.level !== 1) continue;

    const referralCount = await tx.user.count({
      where: { referrerId: c.earnerId },
    });

    const badges = await tx.badge.findMany({
      where: {
        referralThreshold: { lte: referralCount },
        isActive: true,
      },
    });

    for (const badge of badges) {
      const existing = await tx.badgeAward.findUnique({
        where: {
          userId_badgeId: { userId: c.earnerId, badgeId: badge.id },
        },
      });

      if (!existing) {
        await tx.badgeAward.create({
          data: { userId: c.earnerId, badgeId: badge.id },
        });

        await tx.notification.create({
          data: {
            userId: c.earnerId,
            type: "BADGE_EARNED",
            title: `Badge Earned: ${badge.name}!`,
            message: Number(badge.rewardAmount) > 0
              ? `Congratulations! You earned the ${badge.name} badge and a $${Number(badge.rewardAmount)} reward.`
              : `Congratulations! You earned the ${badge.name} badge.`,
            data: { badgeId: badge.id, reward: Number(badge.rewardAmount) },
          },
        });
      }
    }
  }
}

export async function getPartnerBalance(userId: string) {
  const [totalPaid, totalPending, totalWithdrawn, pendingWithdrawals] = await Promise.all([
    prisma.commission.aggregate({
      where: { earnerId: userId, status: "PAID" },
      _sum: { commissionAmount: true },
    }),
    prisma.commission.aggregate({
      where: { earnerId: userId, status: "PENDING" },
      _sum: { commissionAmount: true },
    }),
    prisma.withdrawal.aggregate({
      where: { userId, status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.withdrawal.aggregate({
      where: { userId, status: "PENDING" },
      _sum: { amount: true },
    }),
  ]);

  const earned = Number(totalPaid._sum.commissionAmount ?? 0);
  const pending = Number(totalPending._sum.commissionAmount ?? 0);
  const withdrawn = Number(totalWithdrawn._sum.amount ?? 0);
  const pendingW = Number(pendingWithdrawals._sum.amount ?? 0);

  return {
    totalEarned: earned,
    pendingEarnings: pending,
    totalWithdrawn: withdrawn,
    pendingWithdrawals: pendingW,
    availableBalance: earned - withdrawn - pendingW,
  };
}
