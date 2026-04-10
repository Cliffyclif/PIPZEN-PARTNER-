import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { AdminWithdrawalsClient } from "./withdrawals-client";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { requestedAt: "desc" },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Withdrawals" description="Review and process withdrawal requests" />
      <AdminWithdrawalsClient withdrawals={JSON.parse(JSON.stringify(withdrawals))} />
    </div>
  );
}
