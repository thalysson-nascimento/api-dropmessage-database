import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class StaticLikePreferencesRepository {
  async getTotalPostMessages(userId: string) {
    return prisma.postMessageCloudinary.count({ where: { userId } });
  }

  async getTotalReceivedLikes(userId: string) {
    return prisma.likePostMessage.count({
      where: { PostMessageCloudinary: { userId } },
    });
  }

  async getTotalGivenLikes(userId: string) {
    return prisma.likePostMessage.count({ where: { userId } });
  }
}
