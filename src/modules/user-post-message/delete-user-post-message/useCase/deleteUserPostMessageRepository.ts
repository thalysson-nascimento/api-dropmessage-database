import { PrismaClient } from "@prisma/client";

export class DeleteUserPostMessageRepository {
  private prisma = new PrismaClient();

  async findPostById(id: string) {
    return this.prisma.postMessageCloudinary.findUnique({
      where: { id },
    });
  }

  async deletePost(id: string) {
    return this.prisma.postMessageCloudinary.delete({
      where: { id },
    });
  }
}
