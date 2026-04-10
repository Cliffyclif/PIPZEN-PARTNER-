import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "BANNED"]),
});

const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  pipzenReferralLink: z.string().optional().nullable(),
  referrerId: z.string().optional().nullable(),
  status: z.enum(["INVITED", "ACTIVE", "BANNED"]).optional(),
});

// Edit partner details
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = updateSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Check email uniqueness if changing email
    if (data.email && data.email.toLowerCase() !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (existing) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
      }
    }

    // Validate referrer if provided
    if (data.referrerId) {
      if (data.referrerId === params.id) {
        return NextResponse.json({ error: "A partner cannot refer themselves" }, { status: 400 });
      }
      const referrer = await prisma.user.findUnique({ where: { id: data.referrerId } });
      if (!referrer) {
        return NextResponse.json({ error: "Referrer not found" }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.pipzenReferralLink !== undefined) updateData.pipzenReferralLink = data.pipzenReferralLink;
    if (data.referrerId !== undefined) updateData.referrerId = data.referrerId;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}

// Toggle ban/unban
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { status } = patchSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}

// Delete partner
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            referrals: true,
            purchases: true,
            earnedCommissions: true,
            withdrawals: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting admin users
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 400 });
    }

    // Unlink referrals (set their referrerId to null) so they aren't orphaned
    await prisma.user.updateMany({
      where: { referrerId: id },
      data: { referrerId: null },
    });

    // Delete all related records in a transaction
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.badgeAward.deleteMany({ where: { userId: id } }),
      prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
      prisma.withdrawal.deleteMany({ where: { userId: id } }),
      prisma.commission.deleteMany({ where: { OR: [{ earnerId: id }, { buyerId: id }] } }),
      prisma.purchase.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        referrer: { select: { id: true, fullName: true, email: true } },
        referrals: { select: { id: true, fullName: true, email: true, status: true, createdAt: true } },
        _count: { select: { referrals: true, earnedCommissions: true, purchases: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
