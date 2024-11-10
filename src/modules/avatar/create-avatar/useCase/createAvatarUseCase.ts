import { PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";

const prisma = new PrismaClient();

export class CreateAvatarUseCase {
  async execute(data: {
    fileImage: string;
    dateOfBirth: string;
    gender: string;
    interests: string;
    userId: string;
  }) {
    const { fileImage, userId, dateOfBirth, gender, interests } = data;
    console.log({ fileImage, userId, dateOfBirth, gender, interests });

    const existeAvatar = await prisma.avatar.findFirst({
      where: {
        userId: {
          equals: userId,
        },
      },
    });

    if (existeAvatar) {
      throw createHttpError(402, "avatar existente");
    }

    const avatar = await prisma.avatar.create({
      data: {
        image: fileImage,
        userId: userId,
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

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isUploadAvatar: true,
      },
    });

    await prisma.aboutMe.create({
      data: {
        userId: userId,
        dateOfBirth: dateOfBirth,
        gender: gender,
        interests: interests,
      },
    });

    const avatarWithPathImage = {
      ...avatar,
      image: `${process.env.BASE_URL}/image/user-avatar/${avatar.image}`,
    };

    return avatarWithPathImage;
  }
}
