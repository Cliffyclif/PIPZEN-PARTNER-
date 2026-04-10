import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    await requireAuth();
    const { materialId } = await req.json();
    if (!materialId) {
      return NextResponse.json({ error: "Missing materialId" }, { status: 400 });
    }

    await prisma.marketingMaterial.update({
      where: { id: materialId },
      data: { downloadCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
