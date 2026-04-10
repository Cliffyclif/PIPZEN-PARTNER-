import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-guard";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Header } from "@/components/layout/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/admin/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminSidebar />
      <div className="lg:pl-64">
        <Header variant="admin" />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
