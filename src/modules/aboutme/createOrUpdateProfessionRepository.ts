import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AboutMeRepository {
  async findByUserId(userId: string) {
    return prisma.aboutMe.findUnique({ where: { userId } });
  }

  async createOrUpdateProfession(userId: string, profession: string) {
    const aboutMe = await this.findByUserId(userId);
    if (aboutMe) {
      return prisma.aboutMe.update({
        where: { userId },
        data: { profession },
        select: { profession: true },
      });
    }
  }
}
