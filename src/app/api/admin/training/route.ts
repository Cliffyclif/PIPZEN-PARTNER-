import { NextResponse } from "next/server";
import { requireAdmin, requireAuth, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const resourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["VIDEO", "PDF", "ARTICLE", "COURSE"]),
  url: z.string().url(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().optional(),
});

export async function GET() {
  try {
    await requireAuth();
    const resources = await prisma.trainingResource.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(resources);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = resourceSchema.parse(body);

    const resource = await prisma.trainingResource.create({ data });
    return NextResponse.json({ success: true, resource });
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

    await prisma.trainingResource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
