import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBadgeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  referralThreshold: z.coerce.number().positive().optional(),
  rewardAmount: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
  iconUrl: z.string().optional().nullable(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateBadgeSchema.parse(body);

    const badge = await prisma.badge.update({
      where: { id },
      data,
    });
    return NextResponse.json({ success: true, badge });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if badge has any awards — prevent deletion if so
    const awardCount = await prisma.badgeAward.count({ where: { badgeId: id } });
    if (awardCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete badge that has been awarded to ${awardCount} partner(s). Deactivate it instead.` },
        { status: 400 }
      );
    }

    await prisma.badge.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
