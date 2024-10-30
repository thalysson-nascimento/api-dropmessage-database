import { PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";

const prisma = new PrismaClient();

export class CreateAvatarUseCase {
  async execute(data: { fileImage: string; userId: string }) {
    const { fileImage, userId } = data;

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
        id: true,
        image: true,
        createdAt: true,
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

    return avatar;
  }
}
