import { prismaCliente } from "../../../../database/prismaCliente";

export class GetPostMessageCloudinaryRepository {
  async getUserData(userId: string) {
    return prismaCliente.user.findUnique({
      where: { id: userId },

      select: {
        About: {
          select: {
            interests: true,
          },
        },

        StripeSignature: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,

          select: {
            status: true,
          },
        },
      },
    });
  }

  async findPostsWithCount(
    userId: string,
    interests: string,
    offset: number,
    limit: number,
  ) {
    const whereClause = {
      expirationTimer: { gt: new Date() },
      isExpired: false,

      userId: { not: userId },

      AND: [
        {
          NOT: {
            LikePostMessage: {
              some: { userId },
            },
          },
        },

        {
          NOT: {
            UnLikePostMessage: {
              some: { userId },
            },
          },
        },
      ],

      user: {
        isDeactivated: false,

        About: {
          gender:
            interests === "ambos" ? { in: ["male", "female"] } : interests,
        },
      },
    };

    const [totalItems, posts] = await prismaCliente.$transaction([
      prismaCliente.postMessageCloudinary.count({
        where: whereClause,
      }),

      prismaCliente.postMessageCloudinary.findMany({
        skip: offset,
        take: limit,

        where: whereClause,

        select: {
          id: true,
          image: true,
          expirationTimer: true,
          typeExpirationTimer: true,

          user: {
            select: {
              name: true,

              avatar: {
                select: { image: true },
              },

              UserLocation: {
                select: {
                  city: true,
                  stateCode: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return { totalItems, posts };
  }

  async findSiguinatureByUserId(userId: string) {
    return prismaCliente.stripeSignature.findFirst({
      where: { userId },
    });
  }
}
