import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  buyerName: z.string().min(1).optional(),
  buyerEmail: z.string().email().optional(),
  packageName: z.string().min(1).optional(),
  packageType: z.enum(["INSTANT_FUNDING", "EVALUATION"]).optional(),
  amount: z.number().positive().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = updateSchema.parse(body);

    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    // Update the buyer's info if provided
    if (data.buyerName || data.buyerEmail) {
      const userUpdate: Record<string, string> = {};
      if (data.buyerName) userUpdate.fullName = data.buyerName;
      if (data.buyerEmail) userUpdate.email = data.buyerEmail.toLowerCase();

      await prisma.user.update({
        where: { id: purchase.userId },
        data: userUpdate,
      });
    }

    // Update purchase fields
    const purchaseUpdate: Record<string, unknown> = {};
    if (data.packageName) purchaseUpdate.packageName = data.packageName;
    if (data.packageType) purchaseUpdate.packageType = data.packageType;
    if (data.amount) purchaseUpdate.amount = data.amount;

    if (Object.keys(purchaseUpdate).length > 0) {
      await prisma.purchase.update({
        where: { id: params.id },
        data: purchaseUpdate,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: { _count: { select: { commissions: true } } },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    // Delete related commissions first, then the purchase
    await prisma.$transaction([
      prisma.commission.deleteMany({ where: { purchaseId: params.id } }),
      prisma.purchase.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ success: true, commissionsDeleted: purchase._count.commissions });
  } catch (error) {
    return handleApiError(error);
  }
}
