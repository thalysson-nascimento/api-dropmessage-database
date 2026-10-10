import { getImageUrl, getAvatarThumbnailUrl } from "../../../../service/cloudinary.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class GetMyProfileUseCase {
  async execute(id: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        name: true,
        email: true,
        avatar: { select: { image: true, version: true, thumbnail: true, thumbnailVersion: true } },
        UserLocation: {
          select: {
            state: true,
            stateCode: true,
            city: true,
          },
        },
        About: {
          select: {
            dateOfBirth: true,
            gender: true,
            interests: true,
          },
        },
      },
    });

    return user ? { ...user, avatar: user.avatar ? { image: getImageUrl(user.avatar.image, user.avatar.version ?? undefined), thumbnailUrl: getAvatarThumbnailUrl(user.avatar) } : null } : null;
  }
}
