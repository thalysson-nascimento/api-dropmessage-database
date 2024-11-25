import { PrismaClient } from "@prisma/client";

export class CreatePostMessageCloudinaryRepository {
  private prisma = new PrismaClient();

  async createPostMessageCloudinary(
    userId: string,
    expirationTimer: Date,
    typeExpirationTimer: string,
    file: Express.Multer.File
  ) {
    const { mimetype, path, size, filename } = file;

    const createPostMessage = await this.prisma.postMessageCloudinary.create({
      data: {
        userId: userId,
        format: mimetype.split("/")[1],
        image: path,
        optimizedSize: size,
        fileName: filename,
        typeExpirationTimer,
        expirationTimer,
      },
      select: {
        id: true,
        image: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return createPostMessage;
  }
}
