import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const headersList = await headers();
  const host = headersList.get("host")?.split(":")[0] || "";
  if (host === "admin.pipzen.io") {
    redirect("/admin/login");
  }

  return <LoginForm />;
}
