import { PrismaClient } from "@prisma/client";

export class CreateUnLikePostMessageRepository {
  private prisma = new PrismaClient();

  async findPostMessageById(postMessageId: string) {
    const postMessage = await this.prisma.postMessageCloudinary.findFirst({
      where: {
        id: {
          equals: postMessageId,
        },
      },
    });

    return postMessage;
  }

  async unLikePostMessage(postMessageId: string, userId: string) {
    const unLikePost = await this.prisma.unLikePostMessage.create({
      data: {
        postId: postMessageId,
        userId: userId,
      },
      select: {
        id: true,
        postId: true,
        createdAt: true,
      },
    });

    return unLikePost;
  }

  async findUnLikePostMessage(postMessageId: string, userId: string) {
    return await this.prisma.unLikePostMessage.findFirst({
      where: {
        postId: {
          equals: postMessageId,
        },
        userId: {
          equals: userId,
        },
      },
    });
  }
}
