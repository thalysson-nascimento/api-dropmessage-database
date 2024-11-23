import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class DeleteAccountRepository {
  async deleteAccountByUserId(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        isDeactivated: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });
  }

  async findUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
