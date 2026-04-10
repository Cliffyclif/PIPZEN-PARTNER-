import { NextResponse } from "next/server";
import { requirePartner, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { profileSchema } from "@/lib/validations/profile";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requirePartner();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        fullName: true,
        email: true,
        phone: true,
        address: true,
        socialMedia: true,
        desiredNetworkSize: true,
        pipzenReferralLink: true,
        avatarUrl: true,
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requirePartner();
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
