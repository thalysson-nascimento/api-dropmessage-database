import { PrismaClient } from "@prisma/client";

export class GetPostMessageCloudinaryRepository {
  private prisma = new PrismaClient();

  async totalItemsPostMessageCloudinary(userId: string) {
    return await this.prisma.postMessageCloudinary.count({
      where: {
        expirationTimer: {
          gt: new Date(),
        },
        userId: {
          not: userId,
        },
        NOT: {
          LikePostMessage: {
            some: {
              userId: userId,
            },
          },
        },
        // TODO: implementar regra tambem de nao aparecer os posts quando o usuario nao curtir
      },
    });
  }

  async userPreferences(userId: string) {
    return await this.prisma.aboutMe.findUnique({
      where: {
        userId: userId,
      },
      select: {
        interests: true,
      },
    });
  }

  async getPostMessageCloudinary(
    userId: string,
    interests: string,
    offset: number,
    limit: number
  ) {
    return await this.prisma.postMessageCloudinary.findMany({
      skip: offset,
      take: limit,
      where: {
        expirationTimer: {
          gt: new Date(),
        },
        isExpired: false,
        userId: {
          not: userId,
        },
        NOT: {
          LikePostMessage: {
            some: {
              userId: userId,
            },
          },
        },
        user: {
          isDeactivated: false,
          About: {
            OR:
              interests === "ambos"
                ? [{ gender: "homem" }, { gender: "mulher" }]
                : { gender: interests },
          },
        },
      },
      select: {
        id: true,
        image: true,
        expirationTimer: true,
        typeExpirationTimer: true,
        user: {
          select: {
            UserLocation: {
              select: {
                city: true,
                stateCode: true,
              },
            },
            name: true,
            avatar: {
              select: {
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // async getPostMessageCloudinary(
  //   userId: string,
  //   interests: string,
  //   offset: number,
  //   limit: number
  // ) {
  //   await this.prisma.postMessageCloudinary.findMany({
  //     skip: offset,
  //     take: limit,
  //     where: {
  //       expirationTimer: {
  //         gt: new Date(),
  //       },
  //       isExpired: false,
  //       userId: {
  //         not: userId,
  //       },
  //       NOT: {
  //         LikePostMessage: {
  //           some: {
  //             userId: userId,
  //           },
  //         },
  //       },
  //       user: {
  //         isDeactivated: false,
  //         About: {
  //           OR:
  //             interests === "ambos"
  //               ? [{ gender: "homem" }, { gender: "mulher" }]
  //               : { gender: interests },
  //         },
  //       },
  //     },
  //     select: {
  //       id: true,
  //       image: true,
  //       expirationTimer: true,
  //       typeExpirationTimer: true,
  //       user: {
  //         select: {
  //           UserLocation: {
  //             select: {
  //               city: true,
  //               stateCode: true,
  //             },
  //           },
  //           name: true,
  //           avatar: {
  //             select: {
  //               image: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //     orderBy: {
  //       createdAt: "desc",
  //     },
  //   });
  // }
}
