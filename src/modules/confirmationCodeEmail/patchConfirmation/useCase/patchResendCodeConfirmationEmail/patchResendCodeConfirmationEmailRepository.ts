import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class PatchResendCodeConfirmationEmailRepository {
  async findUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
