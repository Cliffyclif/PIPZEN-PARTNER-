import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PartnersClient } from "./partners-client";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const partners = await prisma.user.findMany({
    where: { role: "PARTNER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      status: true,
      pipzenReferralLink: true,
      createdAt: true,
      referrer: { select: { id: true, fullName: true, email: true } },
      _count: { select: { referrals: true, earnedCommissions: true } },
    },
  });

  const activePartners = await prisma.user.findMany({
    where: { role: "PARTNER", status: "ACTIVE" },
    select: { id: true, fullName: true, email: true },
  });

  return (
    <div>
      <PageHeader title="Partners" description="Manage your partner network" />
      <PartnersClient
        partners={JSON.parse(JSON.stringify(partners))}
        activePartners={JSON.parse(JSON.stringify(activePartners))}
      />
    </div>
  );
}
