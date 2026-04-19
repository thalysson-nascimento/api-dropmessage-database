import { PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";
import { client as redisClient } from "../../../../lib/redis";
import { CreateMatchUseCase } from "../../../match/create-match/useCase/createMatchUseCase";
import { CreateNotificationUseCase } from "../../../notification/create-notification/useCase/createNotificationUseCase";

interface LikePostMessage {
  postId: string;
  userId: string;
}

interface RewardState {
  totalLikes: number;
  mustWatchVideo: boolean;
  rewardWatchCount: number;
  rewardLikesAvailable: number;
  limitReached: boolean;
  cycleExpiresAt: Date | null;
}

const prisma = new PrismaClient();

export class CreateLikePostMessageUseCase {
  private static readonly FREE_LIKE_LIMIT = 2; // o normal deve ser 20
  private static readonly MAX_VIDEO_REWARDS = 3; // e aqui deve ser 5
  private static readonly EXPIRATION_TIME = 12 * 60; // 12 horas em segundos 12 * 60 * 60

  async execute({ postId, userId }: LikePostMessage) {
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
      await redisClient.set(postKey, "active", {
        EX: CreateLikePostMessageUseCase.EXPIRATION_TIME,
      });
    }

    const userSubscription =
      (await redisClient.get(`userPlanSubscription:${userId}`)) || "free";

    const likeLimits: Record<string, number | null> = {
      free: CreateLikePostMessageUseCase.FREE_LIKE_LIMIT,
      start: null,
      gold: null,
      diamond: null,
    };

    const userLimit =
      likeLimits[userSubscription] ??
      CreateLikePostMessageUseCase.FREE_LIKE_LIMIT;

    if (userLimit !== null) {
      const state = await this.loadRewardState(userId);

      if (state.limitReached) {
        return {
          mustVideoWatch: false,
          awaitLikePostMessage: true,
          message: `Você atingiu o limite de ${userLimit} curtidas para este plano. Aguarde 12 horas para curtir novamente.`,
        };
      }

      if (state.mustWatchVideo) {
        return {
          mustVideoWatch: true,
          awaitLikePostMessage: false,
          message: `Você deve assistir o vídeo de publicidade para curtir novamente.`,
        };
      }

      const isInFreeStage = state.rewardLikesAvailable === 0;
      const nextState: RewardState = { ...state };

      if (
        isInFreeStage &&
        nextState.totalLikes < CreateLikePostMessageUseCase.FREE_LIKE_LIMIT
      ) {
        nextState.totalLikes += 1;
      } else if (!isInFreeStage && nextState.rewardLikesAvailable > 0) {
        nextState.totalLikes += 1;
        nextState.rewardLikesAvailable -= 1;

        if (
          nextState.rewardLikesAvailable === 0 &&
          nextState.rewardWatchCount >=
            CreateLikePostMessageUseCase.MAX_VIDEO_REWARDS
        ) {
          nextState.limitReached = true;
        } else if (nextState.rewardLikesAvailable === 0) {
          nextState.mustWatchVideo = true;
        }
      } else if (
        nextState.totalLikes >= CreateLikePostMessageUseCase.FREE_LIKE_LIMIT &&
        nextState.rewardWatchCount <
          CreateLikePostMessageUseCase.MAX_VIDEO_REWARDS
      ) {
        nextState.mustWatchVideo = true;
        await this.persistRewardState(userId, nextState);

        return {
          mustVideoWatch: true,
          awaitLikePostMessage: false,
          message: `Você deve assistir o vídeo de publicidade para curtir novamente.`,
        };
      } else {
        nextState.limitReached = true;
        await this.persistRewardState(userId, nextState);

        return {
          mustVideoWatch: false,
          awaitLikePostMessage: true,
          message: `Você atingiu o limite de ${userLimit} curtidas para este plano. Aguarde 12 horas para curtir novamente.`,
        };
      }

      if (!nextState.cycleExpiresAt) {
        nextState.cycleExpiresAt = new Date(
          Date.now() + CreateLikePostMessageUseCase.EXPIRATION_TIME * 1000,
        );
      }

      await this.persistRewardState(userId, nextState);

      await prisma.likePostMessage.create({
        data: { postId, userId },
        select: { id: true, createdAt: true, postId: true },
      });

      const createNotificationUseCase = new CreateNotificationUseCase();
      await createNotificationUseCase.execute({
        notifiedUserId: postExists.userId,
        actorId: userId,
        type: "LIKE",
        postId,
      });

      const createMatchUseCase = new CreateMatchUseCase();
      await createMatchUseCase.execute(userId, postExists.userId);

      return {
        mustVideoWatch: false,
        awaitLikePostMessage: false,
        message: `Post curtido com sucesso.`,
      };
    }

    try {
      await prisma.likePostMessage.create({
        data: { postId, userId },
        select: { id: true, createdAt: true, postId: true },
      });

      const createMatchUseCase = new CreateMatchUseCase();
      await createMatchUseCase.execute(userId, postExists.userId);

      return {
        mustVideoWatch: false,
        awaitLikePostMessage: false,
        message: `Post curtido com sucesso.`,
      };
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
          "Erro de integridade referencial. Verifique se o post e o usuário existem.",
        );
      }
      throw error;
    }
  }

  private async loadRewardState(userId: string): Promise<RewardState> {
    const [
      redisTotalLikes,
      redisMustWatch,
      redisRewardWatchCount,
      redisRewardLikesAvailable,
      redisLimitReached,
      redisCycleExpiresAt,
    ] = await Promise.all([
      redisClient.get(`countLikePostMessage:${userId}`),
      redisClient.get(`mustVideoWatch:${userId}`),
      redisClient.get(`rewardWatchCount:${userId}`),
      redisClient.get(`rewardLikesAvailable:${userId}`),
      redisClient.get(`userLimiteLikePostMessage:${userId}`),
      redisClient.get(`cycleExpiresAt:${userId}`),
    ]);

    const rewardTracking = await prisma.rewardTracking.findUnique({
      where: { userId },
    });

    if (!rewardTracking) {
      throw createHttpError(
        404,
        "Dados de recompensa do usuário não encontrados.",
      );
    }

    const state: RewardState = {
      totalLikes:
        redisTotalLikes !== null
          ? Number(redisTotalLikes)
          : rewardTracking.totalLikes,
      mustWatchVideo:
        redisMustWatch !== null
          ? redisMustWatch === "true"
          : rewardTracking.mustWatchVideoReword,
      rewardWatchCount:
        redisRewardWatchCount !== null
          ? Number(redisRewardWatchCount)
          : rewardTracking.rewardWatchCount,
      rewardLikesAvailable:
        redisRewardLikesAvailable !== null
          ? Number(redisRewardLikesAvailable)
          : rewardTracking.rewardLikesAvailable,
      limitReached:
        redisLimitReached !== null
          ? redisLimitReached === "true"
          : rewardTracking.limitReached,
      cycleExpiresAt:
        redisCycleExpiresAt !== null
          ? new Date(redisCycleExpiresAt)
          : rewardTracking.cycleExpiresAt,
    };

    if (state.cycleExpiresAt && new Date() > state.cycleExpiresAt) {
      const resetState: RewardState = {
        totalLikes: 0,
        mustWatchVideo: false,
        rewardWatchCount: 0,
        rewardLikesAvailable: 0,
        limitReached: false,
        cycleExpiresAt: null,
      };
      await this.persistRewardState(userId, resetState);
      return resetState;
    }

    await this.syncRedisState(userId, state);

    return state;
  }

  private async persistRewardState(userId: string, state: RewardState) {
    await prisma.rewardTracking.update({
      where: { userId },
      data: {
        totalLikes: state.totalLikes,
        mustWatchVideoReword: state.mustWatchVideo,
        rewardWatchCount: state.rewardWatchCount,
        rewardLikesAvailable: state.rewardLikesAvailable,
        limitReached: state.limitReached,
        cycleExpiresAt: state.cycleExpiresAt,
      },
    });

    await this.syncRedisState(userId, state);
  }

  private async syncRedisState(userId: string, state: RewardState) {
    const ttl = state.cycleExpiresAt
      ? Math.max(
          0,
          Math.floor((state.cycleExpiresAt.getTime() - Date.now()) / 1000),
        )
      : undefined;

    const commands: Array<Promise<unknown>> = [
      redisClient.set(
        `countLikePostMessage:${userId}`,
        String(state.totalLikes),
      ),
      redisClient.set(`mustVideoWatch:${userId}`, String(state.mustWatchVideo)),
      redisClient.set(
        `rewardWatchCount:${userId}`,
        String(state.rewardWatchCount),
      ),
      redisClient.set(
        `rewardLikesAvailable:${userId}`,
        String(state.rewardLikesAvailable),
      ),
      redisClient.set(
        `userLimiteLikePostMessage:${userId}`,
        String(state.limitReached),
      ),
    ];

    if (ttl && ttl > 0 && state.cycleExpiresAt) {
      commands.push(
        redisClient.expire(`countLikePostMessage:${userId}`, ttl),
        redisClient.expire(`mustVideoWatch:${userId}`, ttl),
        redisClient.expire(`rewardWatchCount:${userId}`, ttl),
        redisClient.expire(`rewardLikesAvailable:${userId}`, ttl),
        redisClient.expire(`userLimiteLikePostMessage:${userId}`, ttl),
        redisClient.set(
          `cycleExpiresAt:${userId}`,
          state.cycleExpiresAt.toISOString(),
        ),
        redisClient.expire(`cycleExpiresAt:${userId}`, ttl),
      );
    }

    await Promise.all(commands);
  }
}
