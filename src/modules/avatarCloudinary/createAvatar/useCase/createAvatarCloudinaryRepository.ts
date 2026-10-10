import { prismaCliente } from "../../../../database/prismaCliente";
import { queueMediaCleanup } from "../../../media-upload/mediaDomainPublisher";
import { mediaError } from "../../../media-upload/mediaUploadContract";

export interface AboutUser {
  dateOfBirth: string;
  gender: string;
  interests: string;
}

export class CreateAvatarCloudinaryRepository {
  private prisma = prismaCliente;

  reserveRevision(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { avatarUploadRevision: { increment: 1 } }, select: { avatarUploadRevision: true } });
  }
  queueCleanup(publicId: string) { return this.prisma.$transaction(tx => queueMediaCleanup(tx, publicId)); }
  async publishInitial(userId: string, revision: number, about: AboutUser, file: Express.Multer.File, publicId: string) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`;
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.avatarUploadRevision !== revision) throw mediaError(409, "AVATAR_SUPERSEDED", "Existe uma intenção mais recente");
      await tx.aboutMe.upsert({ where: { userId }, create: { ...about, userId }, update: about });
      const avatar = await tx.avatarCloudinary.create({ data: { userId, image: publicId, format: file.mimetype.split("/")[1], fileName: file.originalname, optimizedSize: file.size },
        select: { image: true, createdAt: true, user: { select: { name: true, email: true } } } });
      await tx.user.update({ where: { id: userId }, data: { isUploadAvatar: true } });
      return avatar;
    });
  }
  async createAboutUser(
    userId: string,
    { dateOfBirth, gender, interests }: AboutUser
  ) {
    await this.prisma.aboutMe.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        dateOfBirth,
        gender,
        interests,
      },
    });
  }

  async updateStatusUploadAvatar(userId: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isUploadAvatar: true,
      },
    });
  }

  async verifyCreateAvatarCloudinary(userId: string) {
    return await this.prisma.avatarCloudinary.findFirst({
      where: {
        userId: {
          equals: userId,
        },
      },
    });
  }

  async saveAvatar(
    userId: string,
    file: Express.Multer.File,
    publicId: string
  ) {
    const { mimetype, size, originalname } = file;

    const createAvatar = await this.prisma.avatarCloudinary.create({
      data: {
        user: {
          connect: { id: userId },
        },
        format: mimetype.split("/")[1],
        image: publicId,
        optimizedSize: size,
        fileName: originalname,
      },
      select: {
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

    return createAvatar;
  }
}
