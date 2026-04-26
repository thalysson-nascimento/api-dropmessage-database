import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class DeleteAccountRepository {
  async deleteAccountByUserId(userId: string) {
    return await prisma.user.delete({
      where: { id: userId },
    });
  }

  async findUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
