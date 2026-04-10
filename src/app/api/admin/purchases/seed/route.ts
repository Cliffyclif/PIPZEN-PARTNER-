import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { seedPurchaseWithCommissions } from "@/lib/commission-engine";
import { seedPurchaseSchema } from "@/lib/validations/purchase";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const data = seedPurchaseSchema.parse(body);

    // Verify user exists and is active
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "User is not active" }, { status: 400 });
    }

    const result = await seedPurchaseWithCommissions({
      userId: data.userId,
      amount: data.amount,
      packageName: data.packageName,
      packageType: data.packageType,
      seededById: session.user.id,
    });

    return NextResponse.json({
      success: true,
      purchase: result.purchase,
      commissionsCreated: result.commissions.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
