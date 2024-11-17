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
        UserLocation: {
          select: {
            state: true,
            stateCode: true,
            city: true,
          },
        },
        About: {
          select: {
            dateOfBirth: true,
            gender: true,
            interests: true,
          },
        },
      },
    });

    return user;
  }
}
