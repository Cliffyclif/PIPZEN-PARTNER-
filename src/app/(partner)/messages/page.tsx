import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MessagingClient } from "@/components/messaging/messaging-client";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // For partners, they message admins
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, fullName: true, email: true },
  });

  return (
    <div>
      <PageHeader title="Messages" description="Chat with your admin support" />
      <MessagingClient
        currentUserId={session.user.id}
        contacts={JSON.parse(JSON.stringify(admins))}
      />
    </div>
  );
}
