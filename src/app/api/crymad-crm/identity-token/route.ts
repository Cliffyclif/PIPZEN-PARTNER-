import { NextResponse } from "next/server";
import { requirePartner, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { environmentForEmail, isCrmIdentityConfigured } from "@/lib/crymad-crm/config";
import { issueIdentityToken } from "@/lib/crymad-crm/identity";

export const dynamic = "force-dynamic";

// GET /api/crymad-crm/identity-token: signed identity for the chat widget.
// A new token (new jti) on every call; never cached.
export async function GET() {
  try {
    const session = await requirePartner();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, fullName: true, status: true, passwordHash: true },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const environment = environmentForEmail(user.email);
    if (!isCrmIdentityConfigured(environment)) {
      return NextResponse.json({ error: "Support chat is not configured" }, { status: 503 });
    }

    const { token, expiresAt } = issueIdentityToken(environment, user);
    return NextResponse.json({ token, expires_at: expiresAt }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}
