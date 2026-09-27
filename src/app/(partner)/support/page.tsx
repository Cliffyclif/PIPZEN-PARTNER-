import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { crmEnvironment } from "@/lib/crymad-crm/config";
import { listCustomerTickets, type TicketPage } from "@/lib/crymad-crm/client";
import { getPartnerSupportContext } from "@/lib/crymad-crm/partner-support";
import { SupportClient } from "./support-client";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getPartnerSupportContext(session.user.id);
  if (!ctx) redirect("/login");

  let page: TicketPage | null = null;
  let loadError = false;
  if (ctx.configured) {
    try {
      page = await listCustomerTickets(ctx.environment, ctx.externalId, { limit: 20 });
    } catch (error) {
      console.error("[crymad-crm] Loading support tickets failed", error);
      loadError = true;
    }
  }

  return (
    <div>
      <PageHeader title="Support" description="Get help from Pipzen Support and track your requests" />
      <SupportClient
        configured={ctx.configured}
        chatEnabled={Boolean(crmEnvironment(ctx.environment).widgetKey)}
        loadError={loadError}
        initialTickets={page?.tickets ?? []}
        initialCursor={page?.nextCursor ?? null}
      />
    </div>
  );
}
