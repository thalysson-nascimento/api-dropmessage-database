import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetLastLoggedUsersRepository {
  async getLastLoggedUsers(userId: string) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        About: { select: { interests: true, gender: true } },
      },
    });

    if (!currentUser) throw new Error("Usuário não encontrado");

    const interest = currentUser.About?.interests;
    const gender = currentUser.About?.gender;

    const loggedUsers = await prisma.loggedUsers.findMany({
      where: {
        userId: { not: userId },
        user: {
          About: { gender: interest },
        },
      },
      distinct: ["userId"],
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: { select: { image: true } },
            About: { select: { dateOfBirth: true } },
            UserLocation: { select: { countryCode: true } },
          },
        },
      },
    });

    const firstPublication = await this.userFirstPublication(userId);
    console.log(firstPublication);

    const results = loggedUsers
      .map((logged) => {
        const { id, name, avatar, About, UserLocation } = logged.user;
        let age: number | null = null;
        if (About?.dateOfBirth) {
          const [day, month, year] = About.dateOfBirth.split("/").map(Number);
          const birthDate = new Date(year, month - 1, day);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        return {
          id,
          name,
          avatar: avatar?.image || null,
          age,
          country: UserLocation?.countryCode || null,
        };
      })
      .slice(0, 12);

    return {
      isUserFirsPublication: firstPublication,
      gender: gender,
      data: results,
    };
  }

  async userFirstPublication(userId: string): Promise<boolean> {
    const post = await prisma.postMessageCloudinary.findFirst({
      where: {
        userId,
      },
    });

    return !post;
  }
}
