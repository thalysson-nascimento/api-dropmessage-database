import { PrismaClient } from "@prisma/client";

export class UpdateUserPostMessageRepository {
  private prisma = new PrismaClient();

  async findPostById(id: string) {
    return this.prisma.postMessageCloudinary.findUnique({
      where: { id },
    });
  }

  async updatePost(
    id: string,
    data: {
      typeExpirationTimer: string;
      expirationTimer: Date;
      isExpired: boolean;
    },
  ) {
    return this.prisma.postMessageCloudinary.update({
      where: { id },
      data,
    });
  }
}
