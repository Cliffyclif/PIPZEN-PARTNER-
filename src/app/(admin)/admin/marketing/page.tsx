import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MarketingClient } from "./marketing-client";

export const dynamic = "force-dynamic";

export default async function AdminMarketingPage() {
  const materials = await prisma.marketingMaterial.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Marketing Materials" description="Upload and manage marketing resources for partners" />
      <MarketingClient initialMaterials={JSON.parse(JSON.stringify(materials))} />
    </div>
  );
}
