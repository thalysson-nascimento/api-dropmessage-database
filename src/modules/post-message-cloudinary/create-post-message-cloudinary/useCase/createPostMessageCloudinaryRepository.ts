import { PrismaClient } from "@prisma/client";

export class CreatePostMessageCloudinaryRepository {
  private prisma = new PrismaClient();

  async createPostMessageCloudinary(
    userId: string,
    expirationTimer: Date,
    typeExpirationTimer: string,
    file: Express.Multer.File,
    publicId: string
  ) {
    const { mimetype, size, filename } = file;

    const createPostMessage = await this.prisma.postMessageCloudinary.create({
      data: {
        format: mimetype.split("/")[1],
        image: publicId,
        optimizedSize: size,
        fileName: file.originalname,
        typeExpirationTimer,
        expirationTimer,

        user: {
          connect: { id: userId },
        },
      },
      select: {
        id: true,
        image: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            StripeSignature: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    return createPostMessage;
  }

  async adminActivePlanGoldFreeTrial() {
    const activePlan = await this.prisma.adminActivePlanGoldFreeTrial.findFirst(
      {
        where: {
          activePlan: true,
        },
      }
    );

    return !!activePlan;
  }

  async userFirstPublicationPosMessage(userId: string) {
    return await this.prisma.viewCardOrFirstPublicationPlanGoldFreeTrial.findFirst(
      {
        where: {
          userId: userId,
        },
      }
    );
  }

  async getUserSubscription(userId: string) {
    return this.prisma.stripeSignature.findFirst({
      where: { userId },
    });
  }

  async findActivePostsByUser(userId: string) {
    return this.prisma.postMessageCloudinary.findMany({
      where: {
        userId,
        isExpired: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
      select: {
        image: true,
        fileName: true,
        expirationTimer: true,
      },
    });
  }

  async findSubscriptionGoldFreeTrialByUser(userId: string) {
    const activePlan = await this.prisma.subscriptionGoldFreeTrial.findFirst({
      where: {
        userId,
      },
    });

    return !!activePlan;
  }

  async createSubscriptionGoldFreeTrialByUser(userId: string) {
    return this.prisma.subscriptionGoldFreeTrial.create({
      data: {
        userId,
      },
      select: {
        createdAt: true,
      },
    });
  }

  async userStripeCustomerId(userId: string) {
    return this.prisma.userStripeCustomersId.findFirst({
      where: {
        userId,
      },
      select: {
        customerId: true,
      },
    });
  }
}
