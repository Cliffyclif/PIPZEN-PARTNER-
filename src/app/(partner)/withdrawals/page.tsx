import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPartnerBalance } from "@/lib/commission-engine";
import { PageHeader } from "@/components/shared/page-header";
import { WithdrawalsClient } from "./withdrawals-client";

export const dynamic = "force-dynamic";

export default async function WithdrawalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [withdrawals, balance] = await Promise.all([
    prisma.withdrawal.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: "desc" },
    }),
    getPartnerBalance(session.user.id),
  ]);

  const minSetting = await prisma.setting.findUnique({ where: { key: "min_withdrawal" } });
  const minWithdrawal = minSetting ? parseFloat(minSetting.value) : 50;

  return (
    <div>
      <PageHeader title="Withdrawals" description="Request and track your withdrawals" />
      <WithdrawalsClient
        withdrawals={JSON.parse(JSON.stringify(withdrawals))}
        availableBalance={balance.availableBalance}
        minWithdrawal={minWithdrawal}
      />
    </div>
  );
}
