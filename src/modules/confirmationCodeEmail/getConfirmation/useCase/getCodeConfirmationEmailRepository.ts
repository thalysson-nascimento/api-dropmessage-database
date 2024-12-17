import { PrismaClient } from "@prisma/client";

export class GetConfirmationCodeEmailRepository {
  private prisma = new PrismaClient();

  async getConfirmationCodeEmail(userId: string, codeConfirmation: number) {
    return await this.prisma.codeConfirmationEmail.findFirst({
      where: {
        userId,
        codeConfirmation,
      },
      select: {
        codeConfirmation: true,
      },
    });
  }

  async userUpdateConfirmationCodeEmail(userId: string) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        verificationTokenEmail: true,
      },
    });
  }
}
