import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { seedPurchaseWithCommissions } from "@/lib/commission-engine";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addReferralSchema = z.object({
  partnerId: z.string().min(1, "Partner is required"),
  buyerName: z.string().min(1, "Buyer name is required"),
  buyerEmail: z.string().email("Invalid buyer email"),
  packageName: z.string().min(1, "Package name is required"),
  packageType: z.enum(["INSTANT_FUNDING", "EVALUATION"]),
  amount: z.number().positive("Amount must be positive"),
});

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const data = addReferralSchema.parse(body);

    // Validate the partner (referrer) exists and is active
    const partner = await prisma.user.findUnique({ where: { id: data.partnerId } });
    if (!partner || partner.status !== "ACTIVE") {
      return NextResponse.json({ error: "Partner not found or not active" }, { status: 400 });
    }

    // Check if buyer already exists
    let buyer = await prisma.user.findUnique({
      where: { email: data.buyerEmail.toLowerCase() },
    });

    if (buyer) {
      // If buyer exists but has no referrer, link them to this partner
      if (!buyer.referrerId) {
        buyer = await prisma.user.update({
          where: { id: buyer.id },
          data: { referrerId: data.partnerId },
        });
      }
    } else {
      // Create the buyer as a new user under this partner
      buyer = await prisma.user.create({
        data: {
          email: data.buyerEmail.toLowerCase(),
          fullName: data.buyerName,
          status: "ACTIVE",
          referrerId: data.partnerId,
          profileCompleted: false,
        },
      });
    }

    // Seed the purchase and calculate commissions
    const result = await seedPurchaseWithCommissions({
      userId: buyer.id,
      amount: data.amount,
      packageName: data.packageName,
      packageType: data.packageType,
      seededById: session.user.id,
    });

    // Notify the partner about the new referral
    await prisma.notification.create({
      data: {
        userId: data.partnerId,
        type: "NEW_REFERRAL",
        title: "New Referral!",
        message: `${data.buyerName} (${data.buyerEmail}) purchased ${data.packageName} ($${data.amount.toFixed(2)}) through your referral link.`,
        data: { buyerId: buyer.id, purchaseId: result.purchase.id },
      },
    });

    return NextResponse.json({
      success: true,
      buyer: { id: buyer.id, email: buyer.email, fullName: buyer.fullName },
      purchase: result.purchase,
      commissionsCreated: result.commissions.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
