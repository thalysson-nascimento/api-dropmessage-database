import { PrismaClient } from "@prisma/client";

export class CreateCommentPostMessageRepository {
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

  async consumeUnlock(userId: string, postId: string) {
    return this.prisma.commentAdMobUnlock.update({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      data: {
        used: true,
        unlocked: false,
      },
    });
  }

  async createComment(userId: string, postId: string, content: string) {
    return this.prisma.commentPostMessage.create({
      data: {
        userId,
        postId,
        content,
      },
      select: {
        id: true,
        content: true,
        userId: true,
        postId: true,
        createdAt: true,
      },
    });
  }
}
