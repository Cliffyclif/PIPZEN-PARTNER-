import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validations/message";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get all conversations (unique partner-admin pairs)
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true } },
        receiver: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true } },
      },
    });

    // Group by conversation partner
    const conversations = new Map<string, {
      partnerId: string;
      partnerName: string;
      partnerEmail: string;
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversations.has(partnerId)) {
        const unread = messages.filter(
          (m) => m.senderId === partnerId && m.receiverId === userId && !m.isRead
        ).length;

        conversations.set(partnerId, {
          partnerId,
          partnerName: partner.fullName || partner.email,
          partnerEmail: partner.email,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: unread,
        });
      }
    }

    return NextResponse.json(Array.from(conversations.values()));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const data = messageSchema.parse(body);

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: data.receiverId,
        content: data.content,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: data.receiverId,
        type: "MESSAGE",
        title: "New Message",
        message: `You have a new message from ${session.user.name || session.user.email}`,
        data: { messageId: message.id },
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
