import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class UpdateAvatarRepository {
  async findAvatarByUserId(userId: string) {
    return prisma.avatarCloudinary.findUnique({
      where: { userId },
    });
  }

  async createAvatar(data: {
    userId: string;
    image: string;
    fileName: string;
    format: string;
    version: number;
    optimizedSize: number;
  }) {
    return prisma.avatarCloudinary.create({
      data,
    });
  }

  async updateAvatar(
    userId: string,
    data: {
      image: string;
      version: number;
      fileName: string;
      format: string;
      optimizedSize: number;
    },
  ) {
    return prisma.avatarCloudinary.update({
      where: { userId },
      data,
    });
  }

  async setUserUploadAvatar(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isUploadAvatar: true,
      },
    });
  }
}
