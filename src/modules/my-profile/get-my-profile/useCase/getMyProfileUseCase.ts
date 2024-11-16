import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetMyProfileUseCase {
  async execute(id: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        name: true,
        email: true,
        About: true,
        UserLocation: true,
      },
    });

    return user;
  }
}
