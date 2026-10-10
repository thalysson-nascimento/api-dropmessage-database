import { prismaCliente as prisma } from "../../../../../database/prismaCliente";
import { queueMediaCleanup } from "../../../../media-upload/mediaDomainPublisher";
import { mediaError } from "../../../../media-upload/mediaUploadContract";



export class UpdateAvatarRepository {
  reserveRevision(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { avatarUploadRevision: { increment: 1 } }, select: { avatarUploadRevision: true } });
  }
  queueCleanup(publicId: string) { return prisma.$transaction(tx => queueMediaCleanup(tx, publicId)); }
  async publish(userId: string, revision: number, data: { image: string; version: number; fileName: string; format: string; optimizedSize: number }) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`;
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.avatarUploadRevision !== revision) throw mediaError(409, "AVATAR_SUPERSEDED", "Existe uma intenção de avatar mais recente");
      const old = await tx.avatarCloudinary.findUnique({ where: { userId } });
      await tx.avatarCloudinary.upsert({ where: { userId }, create: { ...data, userId }, update: { ...data, thumbnail: null, thumbnailVersion: null } });
      await tx.user.update({ where: { id: userId }, data: { isUploadAvatar: true } });
      if (old && old.image !== data.image) { await queueMediaCleanup(tx, old.image); if (old.thumbnail) await queueMediaCleanup(tx, old.thumbnail); }
    });
  }
  async findAvatarByUserId(userId: string) {
    return prisma.avatarCloudinary.findUnique({
      where: { userId },
    });
  }

  async createAvatar(data: {
    userId: string;
    image: string;
    fileName: string;
    format: string;
    version: number;
    optimizedSize: number;
  }) {
    return prisma.avatarCloudinary.create({
      data,
    });
  }

  async updateAvatar(
    userId: string,
    data: {
      image: string;
      version: number;
      fileName: string;
      format: string;
      optimizedSize: number;
    },
  ) {
    return prisma.avatarCloudinary.update({
      where: { userId },
      data,
    });
  }

  async setUserUploadAvatar(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isUploadAvatar: true,
      },
    });
  }
}
