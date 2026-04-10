import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalPartners,
      activePartners,
      totalPurchases,
      purchaseSum,
      totalCommissions,
      commissionSum,
      pendingWithdrawals,
      withdrawalSum,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "PARTNER" } }),
      prisma.user.count({ where: { role: "PARTNER", status: "ACTIVE" } }),
      prisma.purchase.count(),
      prisma.purchase.aggregate({ _sum: { amount: true } }),
      prisma.commission.count(),
      prisma.commission.aggregate({ _sum: { commissionAmount: true } }),
      prisma.withdrawal.count({ where: { status: "PENDING" } }),
      prisma.withdrawal.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      totalPartners,
      activePartners,
      totalPurchases,
      totalPurchaseAmount: Number(purchaseSum._sum.amount ?? 0),
      totalCommissions,
      totalCommissionAmount: Number(commissionSum._sum.commissionAmount ?? 0),
      pendingWithdrawals,
      pendingWithdrawalAmount: Number(withdrawalSum._sum.amount ?? 0),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
