import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const badgeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  referralThreshold: z.coerce.number().positive(),
  rewardAmount: z.coerce.number().min(0),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const badges = await prisma.badge.findMany({
      orderBy: { referralThreshold: "asc" },
      include: { _count: { select: { awards: true } } },
    });
    return NextResponse.json(badges);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = badgeSchema.parse(body);

    const badge = await prisma.badge.create({ data });
    return NextResponse.json({ success: true, badge });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
