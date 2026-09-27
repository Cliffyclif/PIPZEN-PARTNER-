import { prisma } from "@/lib/prisma";
import { findPartnerById, parseExternalId } from "@/lib/crymad-crm/customer";
import { clampLimit, crmError, crmJson, decodeCursor, encodeCursor } from "@/lib/crymad-crm/http";
import { handleSignedRequest } from "@/lib/crymad-crm/inbound";
import { purchaseRecord } from "@/lib/crymad-crm/records";

export const dynamic = "force-dynamic";

// GET /crymad-crm/v1/customers/{external_id}/orders?limit=&cursor=
// Evaluations and instant-funding accounts the partner bought themselves.
export async function GET(req: Request, { params }: { params: { externalId: string } }) {
  return handleSignedRequest(req, async (_rawBody, env) => {
    const url = new URL(req.url);
    const limit = clampLimit(url.searchParams.get("limit"));
    const cursor = decodeCursor(url.searchParams.get("cursor"));
    if (cursor === "invalid") return crmError(400, "validation_failed", "Invalid cursor");

    const userId = parseExternalId(params.externalId);
    const partner = userId ? await findPartnerById(env, userId) : null;
    if (!partner) return crmError(404, "customer_not_found", "No Pipzen partner has this external id");

    const before = cursor ? { at: new Date(cursor.at), id: cursor.id } : null;
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: partner.id,
        ...(before && { OR: [{ purchasedAt: { lt: before.at } }, { purchasedAt: before.at, id: { lt: before.id } }] }),
      },
      orderBy: [{ purchasedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const page = purchases.slice(0, limit);
    const last = page[page.length - 1];
    return crmJson({
      data: page.map(purchaseRecord),
      next_cursor:
        purchases.length > limit && last ? encodeCursor({ at: last.purchasedAt.toISOString(), id: last.id }) : null,
    });
  });
}
