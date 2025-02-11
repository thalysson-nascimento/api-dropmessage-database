import { PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";
import { client as redisClient } from "../../../../lib/redis";
import { CreateMatchUseCase } from "../../../match/create-match/useCase/createMatchUseCase";

interface LikePostMessage {
  postId: string;
  userId: string;
}

const TOTAL_LIKES = 25;

const prisma = new PrismaClient();

export class CreateLikePostMessageUseCase {
  async execute({ postId, userId }: LikePostMessage) {
    // Verificar se o post existe
    const postExists = await prisma.postMessageCloudinary.findUnique({
      where: { id: postId },
    });

    if (!postExists) {
      throw createHttpError(404, "Postagem não encontrada.");
    }

    // Verificar se a postagem está expirada
    if (postExists.isExpired) {
      throw createHttpError(409, "Postagem expirada.");
    }

    const userCountLikes = await redisClient.incr(
      `countLikePostMessage:${userId}`
    );

    const mustWatchVideo = await redisClient.get(`mustVideoWatch:${userId}`);

    if (mustWatchVideo === "true") {
      throw createHttpError(409, "Usuário deve assistir ao vídeo.");
    }

    if (userCountLikes >= TOTAL_LIKES) {
      await prisma.rewardTracking.update({
        where: { userId },
        data: { mustWatchVideoReword: true, totalLikes: TOTAL_LIKES },
      });

      await redisClient.set(`mustVideoWatch:${userId}`, "true", {
        NX: true,
      });
    }

    try {
      const likePostMessage = await prisma.likePostMessage.create({
        data: {
          postId: postId,
          userId: userId,
        },
        select: {
          id: true,
          createdAt: true,
          postId: true,
        },
      });

      const createMatchUseCase = new CreateMatchUseCase();
      await createMatchUseCase.execute(userId, postExists.userId);

      return likePostMessage;
    } catch (error: any) {
      // P2002: Indica um conflito de unicidade; deve retornar 409.
      if (
        error.code === "P2002" &&
        error.meta.target.includes("postId") &&
        error.meta.target.includes("userId")
      ) {
        throw createHttpError(409, "Like já existe para este post e usuário.");
      }
      // Capturar e tratar o erro P2003
      if (error.code === "P2003") {
        throw createHttpError(
          400,
          "Erro de integridade referencial. Verifique se o post e o usuário existem."
        );
      }
      throw error;
    }
  }
}
