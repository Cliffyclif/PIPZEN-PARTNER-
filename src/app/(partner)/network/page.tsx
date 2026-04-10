import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getNetworkTree } from "@/lib/network-tree";
import { PageHeader } from "@/components/shared/page-header";
import { ReferralTree } from "@/components/network/referral-tree";

export default async function NetworkPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tree = await getNetworkTree(session.user.id, 3);

  return (
    <div>
      <PageHeader
        title="Your Network"
        description="Visualize your referral tree and track your team"
      />
      <ReferralTree initialTree={JSON.parse(JSON.stringify(tree))} />
    </div>
  );
}
