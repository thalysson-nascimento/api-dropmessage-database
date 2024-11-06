import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetUserUseCase {
  async execute(id: string) {
    const baseUrlAvatar = `${process.env.BASE_URL}/image/user-avatar/`;

    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        name: true,
        email: true,
        createdAt: true,
        avatar: {
          select: {
            image: true,
          },
        },
      },
    });

    const userWithPathImage = {
      ...user,
      avatar:
        user?.avatar && user.avatar.image
          ? `${baseUrlAvatar}/${user.avatar.image}`
          : null,
    };

    return userWithPathImage;
  }
}
