import { PrismaClient } from "@prisma/client";
import { client } from "../../../../lib/redis";
import { getSocketIO } from "../../../../lib/socket";

const prisma = new PrismaClient();
export class CreateSendMessageRepository {
  async getMahctById(matchId: string) {
    return prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        initiator: {
          select: {
            userHashPublic: true,
          },
        },
        recipient: {
          select: {
            userHashPublic: true,
          },
        },
        User: {
          select: {
            userHashPublic: true,
          },
        },
      },
    });
  }

  async createSendMessage(matchId: string, userId: string, content: string) {
    const newMessage = await prisma.message.create({
      data: {
        matchId: matchId,
        userId: userId,
        content: content,
      },
      select: {
        id: true,
        createdAt: true,
        content: true,
        user: {
          select: {
            userHashPublic: true,
            name: true,
            avatar: {
              select: {
                image: true,
                version: true,
              },
            },
          },
        },
      },
    });

    const createSendMessagePathFullImage = {
      ...newMessage,
      user: {
        ...newMessage.user,
        avatar: newMessage.user?.avatar
          ? {
              ...newMessage.user.avatar,
              image: newMessage.user.avatar.image
                ? newMessage.user.avatar.image
                : null,
            }
          : null,
      },
    };

    const cacheKey = `messages:${matchId}:${userId}:0:10`;
    await client.del(cacheKey);

    const io = getSocketIO();
    console.log("📤 emitindo para sala:", matchId);

    io.to(matchId).emit("send-message", {
      id: newMessage.id,
      content: newMessage.content,
      createdAt: newMessage.createdAt,
      user: {
        userHashPublic: newMessage.user.userHashPublic,
        name: newMessage.user.name,
        avatar: newMessage.user.avatar?.image || null,
      },
    });

    return createSendMessagePathFullImage;
  }
}
