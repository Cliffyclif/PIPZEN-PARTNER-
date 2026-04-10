import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PurchasesClient } from "./purchases-client";

export const dynamic = "force-dynamic";

export default async function AdminPurchasesPage() {
  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          referrer: { select: { id: true, fullName: true, email: true } },
        },
      },
      seededBy: { select: { id: true, fullName: true, email: true } },
      _count: { select: { commissions: true } },
    },
  });

  const activePartners = await prisma.user.findMany({
    where: { role: "PARTNER", status: "ACTIVE" },
    select: { id: true, fullName: true, email: true },
  });

  return (
    <div>
      <PageHeader title="Referrals & Purchases" description="Add referrals and track purchase data" />
      <PurchasesClient
        purchases={JSON.parse(JSON.stringify(purchases))}
        activePartners={JSON.parse(JSON.stringify(activePartners))}
      />
    </div>
  );
}
