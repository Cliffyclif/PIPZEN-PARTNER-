import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return (
    <div>
      <PageHeader title="Platform Settings" description="Configure commission rates and platform rules" />
      <SettingsClient settings={settingsMap} />
    </div>
  );
}
