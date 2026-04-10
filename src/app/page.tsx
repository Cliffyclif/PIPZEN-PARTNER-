import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingClient } from "@/components/landing/landing-client";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // On admin domain, redirect to admin login
  const headersList = await headers();
  const host = headersList.get("host")?.split(":")[0] || "";
  if (host === "admin.pipzen.io") {
    redirect("/admin/login");
  }

  return <LandingClient />;
}
