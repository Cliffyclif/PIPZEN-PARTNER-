import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { PartnerSettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function PartnerSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      fullName: true,
      email: true,
      phone: true,
      address: true,
      socialMedia: true,
      desiredNetworkSize: true,
      pipzenReferralLink: true,
    },
  });

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile" />
      <PartnerSettingsClient profile={JSON.parse(JSON.stringify(user))} />
    </div>
  );
}
