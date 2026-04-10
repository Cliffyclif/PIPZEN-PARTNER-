import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        role: true,
        avatarUrl: true,
        pipzenReferralLink: true,
        createdAt: true,
        referrer: { select: { id: true, fullName: true, email: true } },
        _count: { select: { referrals: true, purchases: true, earnedCommissions: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get earnings summary
    const [totalEarned, pendingEarnings, purchases] = await Promise.all([
      prisma.commission.aggregate({
        where: { earnerId: userId, status: "PAID" },
        _sum: { commissionAmount: true },
      }),
      prisma.commission.aggregate({
        where: { earnerId: userId, status: "PENDING" },
        _sum: { commissionAmount: true },
      }),
      prisma.purchase.findMany({
        where: { userId },
        select: { id: true, packageName: true, packageType: true, amount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      ...user,
      totalEarned: Number(totalEarned._sum.commissionAmount ?? 0),
      pendingEarnings: Number(pendingEarnings._sum.commissionAmount ?? 0),
      recentPurchases: purchases,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
