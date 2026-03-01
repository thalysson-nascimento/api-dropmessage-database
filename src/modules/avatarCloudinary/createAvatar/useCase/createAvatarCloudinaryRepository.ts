import { PrismaClient } from "@prisma/client";

export interface AboutUser {
  dateOfBirth: string;
  gender: string;
  interests: string;
}

export class CreateAvatarCloudinaryRepository {
  private prisma = new PrismaClient();

  async createAboutUser(
    userId: string,
    { dateOfBirth, gender, interests }: AboutUser
  ) {
    await this.prisma.aboutMe.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        dateOfBirth,
        gender,
        interests,
      },
    });
  }

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

  async saveAvatar(
    userId: string,
    file: Express.Multer.File,
    publicId: string
  ) {
    const { mimetype, size, originalname } = file;

    const createAvatar = await this.prisma.avatarCloudinary.create({
      data: {
        user: {
          connect: { id: userId },
        },
        format: mimetype.split("/")[1],
        image: publicId,
        optimizedSize: size,
        fileName: originalname,
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
