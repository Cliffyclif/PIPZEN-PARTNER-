import { actionManifest } from "@/lib/crymad-crm/actions";
import { CONTRACT_VERSION, getCrmConfig } from "@/lib/crymad-crm/config";
import { crmJson } from "@/lib/crymad-crm/http";
import { handleSignedRequest } from "@/lib/crymad-crm/inbound";

export const dynamic = "force-dynamic";

// GET /crymad-crm/v1/manifest: what this platform exposes to the CRM.
export async function GET(req: Request) {
  return handleSignedRequest(req, async () =>
    crmJson({
      platform: getCrmConfig().platform,
      contract_version: CONTRACT_VERSION,
      customer_types: [{ type: "partner", external_id_prefix: "pz_partner:" }],
      lookup: {
        customer: "/crymad-crm/v1/customers/{external_id}",
        customer_by_email: "/crymad-crm/v1/customers?email=",
        transactions: "/crymad-crm/v1/customers/{external_id}/transactions",
        orders: "/crymad-crm/v1/customers/{external_id}/orders",
        reference: "/crymad-crm/v1/lookup?ref=",
      },
      actions: actionManifest(),
    })
  );
}
