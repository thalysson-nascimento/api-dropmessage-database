import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ListIAProfileRepository {
  async userLanguage(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        Language: {
          select: { code: true },
        },
        About: {
          select: {
            interests: true,
          },
        },
      },
    });

    return {
      language: user?.Language?.code,
      interests: user?.About?.interests,
    };
  }

  async list(locale?: string, interests?: string) {
    const profiles = await prisma.aIProfile.findMany({
      where: {
        isActive: true,
        sex: {
          equals: interests === "homem" ? "MALE" : "FEMALE",
        },
      },
      select: {
        slug: true,
        name: true,
        description: true,
        age: true,
        country: true,
        city: true,
        avatarUrl: true,
        personality: true,
        style: true,
        bio: true,
        height: true,
        zodiac: true,

        traits: {
          select: {
            trait: {
              select: {
                key: true,
                translations: {
                  where: {
                    locale: locale,
                  },
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },

        interests: {
          select: {
            hobby: {
              select: {
                key: true,
                icon: true,
                translations: {
                  where: {
                    language: locale,
                  },
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },

        lifestyles: {
          select: {
            hobby: {
              select: {
                key: true,
                icon: true,
                translations: {
                  where: {
                    language: locale,
                  },
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return profiles;
  }
}
