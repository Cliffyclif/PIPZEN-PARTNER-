import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { sendWithdrawalStatusEmail } from "@/lib/email";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { status, adminNote } = updateSchema.parse(body);

    const withdrawal = await prisma.withdrawal.update({
      where: { id: params.id },
      data: {
        status,
        adminNote: adminNote || null,
        processedAt: new Date(),
      },
      include: { user: { select: { email: true, id: true } } },
    });

    // Notify partner
    await prisma.notification.create({
      data: {
        userId: withdrawal.user.id,
        type: "WITHDRAWAL_UPDATE",
        title: `Withdrawal ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message: `Your withdrawal of $${Number(withdrawal.amount).toFixed(2)} has been ${status.toLowerCase()}.${adminNote ? ` Note: ${adminNote}` : ""}`,
        data: { withdrawalId: withdrawal.id, status },
      },
    });

    // Send email
    try {
      await sendWithdrawalStatusEmail(
        withdrawal.user.email,
        status,
        Number(withdrawal.amount),
        adminNote
      );
    } catch {
      // Email failure shouldn't block the operation
    }

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
