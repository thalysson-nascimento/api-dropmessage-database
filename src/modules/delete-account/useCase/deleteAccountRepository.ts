import { prismaCliente as prisma } from "../../../database/prismaCliente";
import { queueMediaCleanup } from "../../media-upload/mediaDomainPublisher";



export class DeleteAccountRepository {
  async deleteAccountByUserId(userId: string) {
    return await prisma.$transaction(async tx => {
      const sessions = await tx.directUploadSession.findMany({ where: { userId, purpose: { startsWith: "MEDIA:" } }, include: { assets: true } });
      for (const session of sessions) for (const asset of session.assets) await queueMediaCleanup(tx, asset.publicId);
      const avatar = await tx.avatarCloudinary.findUnique({ where: { userId } });
      if (avatar) { await queueMediaCleanup(tx, avatar.image); if (avatar.thumbnail) await queueMediaCleanup(tx, avatar.thumbnail); }
      return tx.user.delete({ where: { id: userId } });
    });
  }

  async findUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
