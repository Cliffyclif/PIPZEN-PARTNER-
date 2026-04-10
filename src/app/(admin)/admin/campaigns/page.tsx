import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CampaignsClient } from "./campaigns-client";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Campaigns" description="Create and manage campaigns" />
      <CampaignsClient campaigns={JSON.parse(JSON.stringify(campaigns))} />
    </div>
  );
}
