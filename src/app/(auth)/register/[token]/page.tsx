import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/register-form";

export const dynamic = "force-dynamic";

interface RegisterPageProps {
  params: { token: string };
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const user = await prisma.user.findUnique({
    where: { inviteToken: params.token },
    select: {
      id: true,
      email: true,
      status: true,
      inviteTokenExpiry: true,
    },
  });

  if (!user) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Invalid Invitation</h2>
        <p className="text-slate-400">This invitation link is invalid or has already been used.</p>
      </div>
    );
  }

  if (user.status !== "INVITED") {
    redirect("/login");
  }

  if (user.inviteTokenExpiry && new Date() > user.inviteTokenExpiry) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Invitation Expired</h2>
        <p className="text-slate-400">This invitation link has expired. Please contact your referrer for a new one.</p>
      </div>
    );
  }

  return (
    <RegisterForm token={params.token} email={user.email} />
  );
}
