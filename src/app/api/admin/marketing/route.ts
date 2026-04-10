import { NextResponse } from "next/server";
import { requireAdmin, requireAuth, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const materialSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["BANNER", "SOCIAL_MEDIA", "EMAIL_TEMPLATE", "LANDING_PAGE", "OTHER"]),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number(),
  thumbnailUrl: z.string().optional(),
});

export async function GET() {
  try {
    await requireAuth();
    const materials = await prisma.marketingMaterial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(materials);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = materialSchema.parse(body);

    const material = await prisma.marketingMaterial.create({ data });
    return NextResponse.json({ success: true, material });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.marketingMaterial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
