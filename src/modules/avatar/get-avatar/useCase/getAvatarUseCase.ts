import { PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";

const prisma = new PrismaClient();

export class GetAvatarUseCase {
  async execute(userId: string) {
    const userAvatar = await prisma.avatarCloudinary.findFirst({
      where: {
        userId: {
          equals: userId,
        },
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

    if (!userAvatar) {
      return createHttpError(404, "Avatar não encontrado");
    }

    return userAvatar;
  }
}
