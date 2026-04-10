import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { partnerId: string } }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const partnerId = params.partnerId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json(messages);
  } catch (error) {
    return handleApiError(error);
  }
}
