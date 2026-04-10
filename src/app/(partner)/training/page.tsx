import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { TrainingClient } from "./training-client";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const resources = await prisma.trainingResource.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <PageHeader title="Training Resources" description="Learn strategies to grow your network and boost earnings" />
      <TrainingClient resources={JSON.parse(JSON.stringify(resources))} />
    </div>
  );
}
