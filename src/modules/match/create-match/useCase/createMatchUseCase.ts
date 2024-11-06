import { PrismaClient } from "@prisma/client";
import { getSocketIO } from "../../../../lib/socket";

const prisma = new PrismaClient();

interface UserMtachDetails {
  id: string;
  name: string;
  email: string;
  password: string;
  isUploadAvatar: boolean;
  verificationTokenEmail: false;
  createdAt: string;
  updatedAt: string;
}

export class CreateMatchUseCase {
  async execute(initiatorId: string, recipientId: string) {
    console.log({ initiatorId, recipientId });

    const likeFromInitiator = await prisma.likePostMessage.findFirst({
      where: {
        userId: initiatorId,
        post: { userId: recipientId },
      },
    });

    const likeFromRecipient = await prisma.likePostMessage.findFirst({
      where: {
        userId: recipientId,
        post: { userId: initiatorId },
      },
    });

    if (likeFromRecipient && likeFromInitiator) {
      const macthExists = await prisma.match.findFirst({
        where: {
          OR: [
            {
              initiatorId: initiatorId,
            },
            {
              initiatorId: recipientId,
              recipientId: initiatorId,
            },
          ],
        },
      });

      if (!macthExists) {
        console.log("criando match");
        await prisma.match.create({
          data: {
            initiatorId: initiatorId,
            recipientId: recipientId,
          },
          select: {
            id: true,
            initiatorId: true,
            recipientId: true,
            createdAt: true,
          },
        });

        const getAllUsetMatch = await prisma.user.findMany({
          where: {
            id: {
              in: [initiatorId, recipientId],
            },
          },
          select: {
            id: true,
            avatar: {
              select: {
                image: true,
              },
            },
            name: true,
          },
        });

        const getAllUserMatchPathImage = getAllUsetMatch.map((user) => {
          return {
            ...user,
            avatar: user.avatar
              ? `${process.env.BASE_URL}/image/user-avatar/${user.avatar.image}`
              : null,
          };
        });

        console.log("==========================", getAllUserMatchPathImage);

        const io = getSocketIO();
        io.to(initiatorId).emit("match", getAllUserMatchPathImage);
        io.to(recipientId).emit("match", getAllUserMatchPathImage);
      }
    }
  }

  async sendMatchUserDetails(getAllUsetMatch: UserMtachDetails[]) {
    console.log("sendMatchUserDetails", getAllUsetMatch);
  }
}
