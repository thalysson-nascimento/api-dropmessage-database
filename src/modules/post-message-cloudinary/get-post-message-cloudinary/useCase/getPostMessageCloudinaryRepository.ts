import { Prisma } from "@prisma/client";
import { prismaCliente } from "../../../../database/prismaCliente";

export class GetPostMessageCloudinaryRepository {
  async getUserData(userId: string) {
    return prismaCliente.user.findUnique({
      where: { id: userId },
      select: {
        About: { select: { interests: true } },
        StripeSignature: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { status: true } },
      },
    });
  }

  async findPostsWithCount(userId: string, interests: string, offset: number, limit: number) {
    const where: Prisma.PostMessageCloudinaryWhereInput = {
      expirationTimer: { gt: new Date() },
      isExpired: false,
      userId: { not: userId },
      LikePostMessage: { none: { userId } },
      UnLikePostMessage: { none: { userId } },
      CommentPostMessage: { none: { userId } },
      user: {
        isDeactivated: false,
        About: { gender: interests === "both" ? { in: ["male", "female"] } : interests },
      },
    };
    const [totalItems, posts] = await prismaCliente.$transaction([
      prismaCliente.postMessageCloudinary.count({ where }),
      prismaCliente.postMessageCloudinary.findMany({
        where, skip: offset, take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true, image: true, expirationTimer: true, typeExpirationTimer: true,
          user: { select: {
            name: true,
            avatar: { select: { image: true } },
            UserLocation: { select: { city: true, stateCode: true, countryCode: true } },
          } },
        },
      }),
    ]);
    return { totalItems, posts };
  }
}
