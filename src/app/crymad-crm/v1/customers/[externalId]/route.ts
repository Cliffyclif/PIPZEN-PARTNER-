import { buildPartnerLookup, findPartnerById, parseExternalId } from "@/lib/crymad-crm/customer";
import { crmError, crmJson } from "@/lib/crymad-crm/http";
import { handleSignedRequest } from "@/lib/crymad-crm/inbound";

export const dynamic = "force-dynamic";

// GET /crymad-crm/v1/customers/{external_id} : contract section 7 customer lookup.
export async function GET(req: Request, { params }: { params: { externalId: string } }) {
  return handleSignedRequest(req, async (_rawBody, env) => {
    const userId = parseExternalId(params.externalId);
    const partner = userId ? await findPartnerById(env, userId) : null;
    if (!partner) return crmError(404, "customer_not_found", "No Pipzen partner has this external id");
    return crmJson(await buildPartnerLookup(env, partner));
  });
}
