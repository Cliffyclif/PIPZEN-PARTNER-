import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-guard";
import { PartnerSidebar } from "@/components/layout/partner-sidebar";
import { Header } from "@/components/layout/header";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.status === "BANNED") redirect("/login?error=banned");

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Subtle ambient gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/[0.02] rounded-full blur-3xl" />
      </div>
      <PartnerSidebar />
      <div className="lg:pl-64 relative">
        <Header variant="partner" />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
