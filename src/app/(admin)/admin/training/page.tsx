import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { TrainingClient } from "./training-client";

export const dynamic = "force-dynamic";

export default async function AdminTrainingPage() {
  const resources = await prisma.trainingResource.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <PageHeader title="Training Resources" description="Manage training content for partners" />
      <TrainingClient initialResources={JSON.parse(JSON.stringify(resources))} />
    </div>
  );
}
