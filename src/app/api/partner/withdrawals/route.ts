import { NextResponse } from "next/server";
import { requirePartner, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getPartnerBalance } from "@/lib/commission-engine";
import { withdrawalSchema } from "@/lib/validations/withdrawal";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requirePartner();

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json(withdrawals);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePartner();
    const body = await req.json();
    const data = withdrawalSchema.parse(body);

    // Check balance
    const balance = await getPartnerBalance(session.user.id);
    if (data.amount > balance.availableBalance) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Check minimum withdrawal
    const minSetting = await prisma.setting.findUnique({ where: { key: "min_withdrawal" } });
    const minWithdrawal = minSetting ? parseFloat(minSetting.value) : 50;
    if (data.amount < minWithdrawal) {
      return NextResponse.json(
        { error: `Minimum withdrawal is $${minWithdrawal}` },
        { status: 400 }
      );
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: session.user.id,
        amount: data.amount,
        method: data.method,
        bankName: data.method === "BANK" ? data.bankName : null,
        accountNumber: data.method === "BANK" ? data.accountNumber : null,
        accountHolder: data.method === "BANK" ? data.accountHolder : null,
        walletAddress: data.method === "CRYPTO" ? data.walletAddress : null,
        cryptoType: data.method === "CRYPTO" ? data.cryptoType : null,
        cryptoNetwork: data.method === "CRYPTO" ? data.cryptoNetwork : null,
      },
    });

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
