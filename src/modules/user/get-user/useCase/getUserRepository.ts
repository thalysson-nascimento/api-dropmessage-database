import { PrismaClient } from "@prisma/client";

export class GetUserRepository {
  private prisma = new PrismaClient();

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,

        UserDescription: {
          select: {
            description: true,
          },
        },

        Language: {
          select: {
            name: true,
          },
        },

        About: {
          select: {
            dateOfBirth: true,
            profession: true,
            interests: true,
          },
        },

        UserLocation: {
          select: {
            country: true,
            city: true,
          },
        },
      },
    });
  }

  async getUserLanguage(userId: string) {
    const language = await this.prisma.language.findUnique({
      where: {
        userId,
      },
      select: {
        name: true,
      },
    });

    return language?.name ?? "English"; // fallback
  }

  async getUserHobbiesTranslated(userId: string, language: string) {
    const hobbies = await this.prisma.userHobby.findMany({
      where: {
        userId,
      },
      select: {
        hobby: {
          select: {
            icon: true,
            key: true,
            translations: {
              where: {
                language,
              },
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return hobbies;
  }
}
