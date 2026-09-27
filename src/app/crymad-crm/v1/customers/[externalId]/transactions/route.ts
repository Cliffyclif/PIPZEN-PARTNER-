import { prisma } from "@/lib/prisma";
import { findPartnerById, parseExternalId } from "@/lib/crymad-crm/customer";
import { clampLimit, crmError, crmJson, decodeCursor, encodeCursor } from "@/lib/crymad-crm/http";
import { handleSignedRequest } from "@/lib/crymad-crm/inbound";
import { commissionRecord, withdrawalRecord } from "@/lib/crymad-crm/records";

export const dynamic = "force-dynamic";

// GET /crymad-crm/v1/customers/{external_id}/transactions?limit=&cursor=
// Commissions and withdrawals, newest first, keyset-paginated across both tables.
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
    const [commissions, withdrawals] = await Promise.all([
      prisma.commission.findMany({
        where: {
          earnerId: partner.id,
          ...(before && { OR: [{ createdAt: { lt: before.at } }, { createdAt: before.at, id: { lt: before.id } }] }),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        include: { purchase: { select: { packageName: true, packageType: true, amount: true } } },
      }),
      prisma.withdrawal.findMany({
        where: {
          userId: partner.id,
          ...(before && { OR: [{ requestedAt: { lt: before.at } }, { requestedAt: before.at, id: { lt: before.id } }] }),
        },
        orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      }),
    ]);

    const merged = [
      ...commissions.map((c) => ({ at: c.createdAt, id: c.id, record: commissionRecord(c) })),
      ...withdrawals.map((w) => ({ at: w.requestedAt, id: w.id, record: withdrawalRecord(w) })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));

    const page = merged.slice(0, limit);
    const last = page[page.length - 1];
    return crmJson({
      data: page.map((item) => item.record),
      next_cursor: merged.length > limit && last ? encodeCursor({ at: last.at.toISOString(), id: last.id }) : null,
    });
  });
}
