import { prisma } from "@/lib/prisma";
import type { CrmEnvironment } from "@/lib/crymad-crm/config";
import { inEnvironment, partnerStatus, toExternalId } from "@/lib/crymad-crm/customer";
import { crmError, crmJson } from "@/lib/crymad-crm/http";
import { handleSignedRequest } from "@/lib/crymad-crm/inbound";
import { commissionRecord, purchaseRecord, withdrawalRecord } from "@/lib/crymad-crm/records";

export const dynamic = "force-dynamic";

type Owner = { id: string; role: string; email: string };

// A record is only visible when its owner is a partner of the calling environment.
const ownerId = (owner: Owner, env: CrmEnvironment) =>
  owner.role === "PARTNER" && inEnvironment(owner, env) ? toExternalId(owner.id) : null;

// GET /crymad-crm/v1/lookup?ref= : resolves a withdrawal id, commission id,
// purchase id or partner referral code to its record and owner.
export async function GET(req: Request) {
  return handleSignedRequest(req, async (_rawBody, env) => {
    const ref = new URL(req.url).searchParams.get("ref")?.trim();
    if (!ref || ref.length > 200) return crmError(400, "validation_failed", "Pass ?ref= (max 200 characters)");

    const owner = { select: { id: true, role: true, email: true } } as const;
    const [withdrawal, commission, purchase, partner] = await Promise.all([
      prisma.withdrawal.findUnique({ where: { id: ref }, include: { user: owner } }),
      prisma.commission.findUnique({
        where: { id: ref },
        include: { earner: owner, purchase: { select: { packageName: true, packageType: true, amount: true } } },
      }),
      prisma.purchase.findUnique({ where: { id: ref }, include: { user: owner } }),
      prisma.user.findFirst({ where: { referralCode: ref, role: "PARTNER" } }),
    ]);

    if (withdrawal) {
      const { user, ...row } = withdrawal;
      const customer = ownerId(user, env);
      if (customer) return crmJson({ ...withdrawalRecord(row), customer_external_id: customer });
    }
    if (commission) {
      const { earner, ...row } = commission;
      const customer = ownerId(earner, env);
      if (customer) return crmJson({ ...commissionRecord(row), customer_external_id: customer });
    }
    if (purchase) {
      const { user, ...row } = purchase;
      const customer = ownerId(user, env);
      if (customer) return crmJson({ ...purchaseRecord(row), customer_external_id: customer });
    }
    const visiblePartner = inEnvironment(partner, env);
    if (visiblePartner) {
      return crmJson({
        id: toExternalId(visiblePartner.id),
        type: "partner",
        status: partnerStatus(visiblePartner.status),
        created_at: visiblePartner.createdAt.toISOString(),
        reference: visiblePartner.referralCode,
        customer_external_id: toExternalId(visiblePartner.id),
      });
    }
    return crmError(404, "not_found", "No Pipzen record matches this reference");
  });
}
