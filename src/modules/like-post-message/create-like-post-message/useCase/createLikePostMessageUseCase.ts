import { PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";
import { client as redisClient } from "../../../../lib/redis";
import { CreateMatchUseCase } from "../../../match/create-match/useCase/createMatchUseCase";

interface LikePostMessage {
  postId: string;
  userId: string;
}

const TOTAL_LIKES_USER_FREE_SHOW_VIDEO_REWARD = 20;
const EXPIRATION_TIME = 12 * 60 * 60; // 12 horas em segundos

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

    if (postExists.isExpired) {
      throw createHttpError(409, "Postagem expirada.");
    }

    const postKey = `post:${postId}`;
    const existsInRedis = await redisClient.exists(postKey);

    if (!existsInRedis) {
      await redisClient.set(postKey, "active", { EX: EXPIRATION_TIME });
    }

    // Obter plano do usuário no Redis (padrão: free)
    const userSubscription =
      (await redisClient.get(`userPlanSubscription:${userId}`)) || "free";

    // Definir limites por plano (null significa sem limite)
    const likeLimits: Record<string, number | null> = {
      free: 100,
      start: 200,
      gold: 300,
      diamond: null, // Usuário Diamond pode curtir infinitamente
    };

    const userLimit = likeLimits[userSubscription] ?? 100;

    if (userLimit !== null) {
      const userLikeLimitPostMessage =
        Number(await redisClient.get(`userLimiteLikePostMessage:${userId}`)) ||
        0;

      if (!userLikeLimitPostMessage || userLikeLimitPostMessage === 0) {
        await redisClient.incr(`userLimiteLikePostMessage:${userId}`);
        await redisClient.expire(
          `userLimiteLikePostMessage:${userId}`,
          EXPIRATION_TIME
        );
      }

      const countLikePostMessage =
        Number(await redisClient.get(`countLikePostMessage:${userId}`)) || 0;

      if (!countLikePostMessage || countLikePostMessage === 0) {
        await redisClient.incr(`countLikePostMessage:${userId}`);

        await redisClient.expire(
          `countLikePostMessage:${userId}`,
          EXPIRATION_TIME
        );
      }

      if (userLikeLimitPostMessage > userLimit) {
        const response = {
          mustVideoWatch: false,
          awaitLikePostMessage: true,
          message: `Você atingiu o limite de ${likeLimits[userSubscription]} curtidas para este plano. Aguarde 12 horas para curtir novamente.`,
        };

        const redisUserLimiteLikePostMessage = `userLimiteLikePostMessage:${userId}`;
        redisClient.set(redisUserLimiteLikePostMessage, "true", {
          NX: true,
        });

        return response;
      } else if (
        userSubscription === "free" &&
        countLikePostMessage > TOTAL_LIKES_USER_FREE_SHOW_VIDEO_REWARD
      ) {
        const redisKeyMustVideoWatch = `mustVideoWatch:${userId}`;
        await redisClient.set(redisKeyMustVideoWatch, "true");

        const response = {
          mustVideoWatch: true,
          awaitLikePostMessage: false,
          message: `Você deve assitir o vídeo de publicadade para curtir novamente.`,
        };
        return response;
      } else {
        await redisClient.incr(`countLikePostMessage:${userId}`);
        await redisClient.incr(`userLimiteLikePostMessage:${userId}`);
      }

      const response = {
        mustVideoWatch: false,
        awaitLikePostMessage: false,
        message: `Post curtido com sucesso.`,
      };

      return response;
    }

    try {
      const likePostMessage = await prisma.likePostMessage.create({
        data: { postId, userId },
        select: { id: true, createdAt: true, postId: true },
      });
      // Criar correspondência (match)
      const createMatchUseCase = new CreateMatchUseCase();
      await createMatchUseCase.execute(userId, postExists.userId);
      return likePostMessage;
    } catch (error: any) {
      if (
        error.code === "P2002" &&
        error.meta?.target?.includes("postId") &&
        error.meta?.target?.includes("userId")
      ) {
        throw createHttpError(409, "Like já existe para este post e usuário.");
      }
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
