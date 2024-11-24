import { PrismaClient } from "@prisma/client";

export interface AvatarData {
  userId: string;
  file: Express.Multer.File;
}

export class CreateAvatarCloudinaryRepository {
  private prisma = new PrismaClient();

  async updateStatusUploadAvatar(userId: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isUploadAvatar: true,
      },
    });
  }

  async verifyCreateAvatarCloudinary(userId: string) {
    return await this.prisma.avatarCloudinary.findFirst({
      where: {
        userId: {
          equals: userId,
        },
      },
    });
  }

  async saveAvatar(userId: string, file: Express.Multer.File) {
    const { mimetype, path, size, filename } = file;

    const createAvatar = await this.prisma.avatarCloudinary.create({
      data: {
        userId: userId,
        format: mimetype.split("/")[1],
        image: path,
        optimizedSize: size,
        fileName: filename,
      },
      select: {
        image: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return createAvatar;
  }
}
