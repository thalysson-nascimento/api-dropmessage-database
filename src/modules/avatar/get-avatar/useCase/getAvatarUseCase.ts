import { PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";

const prisma = new PrismaClient();

export class GetAvatarUseCase {
  async execute(userId: string) {
    const baseUrlAvatar = `${process.env.BASE_URL}/image/user-avatar/`;
    const userAvatar = await prisma.avatar.findFirst({
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

    const avatarWithPathImage = {
      ...userAvatar,
      image: `${baseUrlAvatar}/${userAvatar.image}`,
    };

    return avatarWithPathImage;
  }
}
