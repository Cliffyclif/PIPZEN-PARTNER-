import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { NextResponse } from "next/server";

export async function getSession() {
  return getServerSession(authOptions);
}

// Session JWTs carry the status from sign-in time, so re-check the database:
// a partner locked or banned later must lose access straight away.
export async function isSessionUserActive(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  return user !== null && user.status !== "BANNED";
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user || !(await isSessionUserActive(session.user.id))) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requirePartner() {
  const session = await requireAuth();
  if (session.user.role !== "PARTNER") {
    throw new Error("Forbidden");
  }
  return session;
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
