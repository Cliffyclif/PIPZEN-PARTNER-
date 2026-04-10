import { NextResponse } from "next/server";
import { getSession, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { profileSchema } from "@/lib/validations/profile";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = profileSchema.parse(body);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address || null,
        socialMedia: data.socialMedia || Prisma.JsonNull,
        desiredNetworkSize: data.desiredNetworkSize || null,
        profileCompleted: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
