import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { password } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { inviteToken: params.token },
    });

    if (!user || user.status !== "INVITED") {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 }
      );
    }

    if (user.inviteTokenExpiry && new Date() > user.inviteTokenExpiry) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: "ACTIVE",
        inviteToken: null,
        inviteTokenExpiry: null,
      },
    });

    // Create notification for referrer
    if (user.referrerId) {
      await prisma.notification.create({
        data: {
          userId: user.referrerId,
          type: "NEW_REFERRAL",
          title: "New Referral!",
          message: `${user.email} just joined your network!`,
          data: { userId: user.id },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
