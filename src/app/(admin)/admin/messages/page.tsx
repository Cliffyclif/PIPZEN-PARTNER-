import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MessagingClient } from "@/components/messaging/messaging-client";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const partners = await prisma.user.findMany({
    where: { role: "PARTNER", status: "ACTIVE" },
    select: { id: true, fullName: true, email: true },
  });

  return (
    <div>
      <PageHeader title="Messages" description="Communicate with your partners" />
      <MessagingClient
        currentUserId={session.user.id}
        contacts={JSON.parse(JSON.stringify(partners))}
      />
    </div>
  );
}
