import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class StaticLikePreferencesRepository {
  async getTotalPostMessages(userId: string) {
    return prisma.postMessage.count({ where: { userId } });
  }

  async getTotalReceivedLikes(userId: string) {
    return prisma.likePostMessage.count({ where: { post: { userId } } });
  }

  async getTotalGivenLikes(userId: string) {
    return prisma.likePostMessage.count({ where: { userId } });
  }
}
