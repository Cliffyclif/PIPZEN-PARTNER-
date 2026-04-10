import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email";
import { generateInviteToken } from "@/lib/utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  email: z.string().email(),
  referrerId: z.string().optional(),
  pipzenReferralLink: z.string().min(1, "Referral link is required"),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { email, referrerId, pipzenReferralLink } = inviteSchema.parse(body);

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Validate referrer exists if provided
    if (referrerId) {
      const referrer = await prisma.user.findUnique({ where: { id: referrerId } });
      if (!referrer) {
        return NextResponse.json({ error: "Referrer not found" }, { status: 400 });
      }
    }

    const inviteToken = generateInviteToken();

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        status: "INVITED",
        inviteToken,
        inviteTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        referrerId: referrerId || undefined,
        pipzenReferralLink,
      },
    });

    // Get referrer name for email
    let referrerName: string | undefined;
    if (referrerId) {
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId },
        select: { fullName: true },
      });
      referrerName = referrer?.fullName || undefined;
    }

    let emailSent = true;
    let emailError = "";
    try {
      await sendInviteEmail(email, inviteToken, referrerName);
    } catch (err) {
      emailSent = false;
      emailError = err instanceof Error ? err.message : "Failed to send email";
      console.error("Invite email failed:", emailError);
    }

    return NextResponse.json({ success: true, user, emailSent, emailError });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
