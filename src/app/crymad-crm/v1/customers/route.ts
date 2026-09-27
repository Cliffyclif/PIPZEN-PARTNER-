import { buildPartnerLookup, findPartnerByEmail } from "@/lib/crymad-crm/customer";
import { crmError, crmJson } from "@/lib/crymad-crm/http";
import { handleSignedRequest } from "@/lib/crymad-crm/inbound";

export const dynamic = "force-dynamic";

// GET /crymad-crm/v1/customers?email= : lookup when the CRM has no external id.
export async function GET(req: Request) {
  return handleSignedRequest(req, async (_rawBody, env) => {
    const email = new URL(req.url).searchParams.get("email");
    if (!email) return crmError(400, "validation_failed", "Pass ?email= or use /customers/{external_id}");
    const partner = await findPartnerByEmail(env, email);
    if (!partner) return crmError(404, "customer_not_found", "No Pipzen partner has this email");
    return crmJson(await buildPartnerLookup(env, partner));
  });
}
