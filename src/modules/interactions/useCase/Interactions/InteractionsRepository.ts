import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class InteractionsRepository {
  async findPostById(postId: string) {
    return prisma.postMessageCloudinary.findUnique({
      where: { id: postId },
    });
  }

  async findUserByHash(userHashPublic: string) {
    return prisma.user.findFirst({
      where: { userHashPublic },
    });
  }

  async createLikePost(postId: string, userId: string) {
    return prisma.likePostMessage.create({
      data: {
        postId,
        userId,
      },
    });
  }

  async createLikeUser(actorId: string, targetUserId: string) {
    return prisma.likeUser.create({
      data: {
        actorId,
        targetUserId,
      },
    });
  }

  async hasNotificationBetweenUsers(actorId: string, targetUserId: string) {
    return prisma.notification.findFirst({
      where: {
        OR: [
          {
            actorId: targetUserId,
            notifiedUserId: actorId,
            type: "LIKE",
          },
          {
            actorId: actorId,
            notifiedUserId: targetUserId,
            type: "LIKE",
          },
        ],
      },
    });
  }

  async hasLikePostBetweenUsers(actorId: string, targetUserId: string) {
    return prisma.likePostMessage.findFirst({
      where: {
        OR: [
          {
            userId: actorId,
            PostMessageCloudinary: {
              userId: targetUserId,
            },
          },
          {
            userId: targetUserId,
            PostMessageCloudinary: {
              userId: actorId,
            },
          },
        ],
      },
    });
  }

  async hasLikeUserBetweenUsers(actorId: string, targetUserId: string) {
    return prisma.likeUser.findFirst({
      where: {
        OR: [
          {
            actorId: actorId,
            targetUserId: targetUserId,
          },
          {
            actorId: targetUserId,
            targetUserId: actorId,
          },
        ],
      },
    });
  }
}
