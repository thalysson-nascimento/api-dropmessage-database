import { PrismaClient } from "@prisma/client";

export class UnlockCommentPostMessageRepository {
  private prisma = new PrismaClient();

  async findPostById(postId: string) {
    return this.prisma.postMessageCloudinary.findUnique({
      where: { id: postId },
    });
  }

  async findActiveUnlock(userId: string, postId: string) {
    return this.prisma.commentAdMobUnlock.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  }

  async unlockComment(userId: string, postId: string) {
    return this.prisma.commentAdMobUnlock.upsert({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      update: {
        unlocked: true,
        used: false,
      },
      create: {
        userId,
        postId,
        unlocked: true,
        used: false,
      },
    });
  }
}
