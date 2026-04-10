import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MarketingMaterialsClient } from "./marketing-client";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [materials, user] = await Promise.all([
    prisma.marketingMaterial.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pipzenReferralLink: true, fullName: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Marketing Materials"
        description="Share promotional assets with your referral link embedded"
      />
      <MarketingMaterialsClient
        materials={JSON.parse(JSON.stringify(materials))}
        referralLink={user?.pipzenReferralLink || null}
        partnerName={user?.fullName?.split(" ")[0] || "Partner"}
      />
    </div>
  );
}
