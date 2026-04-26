import { PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";
import { UserDataEnum } from "../../../../enums/user-data.enum";
import { client as redisClient } from "../../../../lib/redis";
import { CreateMatchUseCase } from "../../../match/create-match/useCase/createMatchUseCase";
import { CreateNotificationUseCase } from "../../../notification/create-notification/useCase/createNotificationUseCase";

interface LikePostMessage {
  postId: string;
  userId: string;
}

type LikePostMessageType = "WATCH_VIDEO" | "AI_SUGGESTION" | "POST";

interface CreateLikePostMessageResponse {
  type: LikePostMessageType[];
  mustVideoWatch: boolean;
  awaitLikePostMessage: boolean;
  message: string;
}

interface RewardState {
  totalLikes: string;
  mustWatchVideo: boolean;
  rewardWatchCount: string;
  extraLikePostMessage: string;
  limitReached: boolean;
  cycleExpiresAt: string | null;
}

const prisma = new PrismaClient();

export class CreateLikePostMessageUseCase {
  private static readonly FREE_LIKE_LIMIT =
    UserDataEnum.FREE_LIKE_LIMIT_POST_MESSAGE; // Para teste, depois alterar para 20
  private static readonly MAX_VIDEO_REWARDS = UserDataEnum.MAX_VIDEO_REWARDS; // e aqui deve ser 5
  private static readonly EXPIRATION_TIME = UserDataEnum.EXPIRATION_TIME; // Para teste, depois alterar para 12 * 60

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

      // Reset após expiração
      if (state.cycleExpiresAt && new Date() > new Date(state.cycleExpiresAt)) {
        state.totalLikes =
          CreateLikePostMessageUseCase.FREE_LIKE_LIMIT.toString();
        state.extraLikePostMessage = "0";
        state.rewardWatchCount = UserDataEnum.MAX_VIDEO_REWARDS.toString();
        state.limitReached = false;
        state.mustWatchVideo = false;
        state.cycleExpiresAt = new Date(
          Date.now() + CreateLikePostMessageUseCase.EXPIRATION_TIME * 1000,
        ).toISOString();
      }

      // Se não tem mais curtidas disponíveis
      if (
        Number(state.totalLikes) <= 0 &&
        Number(state.extraLikePostMessage) <= 0
      ) {
        // Se ainda pode assistir vídeo
        if (
          Number(state.rewardWatchCount) <
          CreateLikePostMessageUseCase.MAX_VIDEO_REWARDS
        ) {
          state.mustWatchVideo = true;
          await this.persistRewardState(userId, state);
          return this.createWatchVideoResponse(
            `Você deve assistir o vídeo de publicidade para ganhar mais curtidas.`,
          );
        } else {
          state.limitReached = true;
          await this.persistRewardState(userId, state);
          return this.createAiSuggestionResponse(
            `Você atingiu o limite de curtidas para este ciclo. Aguarde o tempo de renovação.`,
          );
        }
      }

      // Se está aguardando vídeo, não pode curtir
      if (state.mustWatchVideo) {
        return this.createWatchVideoResponse(
          `Você deve assistir o vídeo de publicidade para ganhar mais curtidas.`,
        );
      }

      // Curtida normal
      if (Number(state.totalLikes) > 0) {
        state.totalLikes = (Number(state.totalLikes) - 1).toString();
        console.log("Curtida normal. Curtidas restantes:", state.totalLikes);
      } else if (Number(state.extraLikePostMessage) > 0) {
        state.extraLikePostMessage = (
          Number(state.extraLikePostMessage) - 1
        ).toString();
        console.log(
          "Curtida de recompensa. Curtidas de recompensa restantes:",
          state.extraLikePostMessage,
        );
      }

      // Atualiza ciclo se não existir
      if (!state.cycleExpiresAt) {
        state.cycleExpiresAt = new Date(
          Date.now() + CreateLikePostMessageUseCase.EXPIRATION_TIME * 1000,
        ).toISOString();
      }

      await this.persistRewardState(userId, state);

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

      return this.createSuccessResponse(`Post curtido com sucesso.`);
    }

    try {
      await prisma.likePostMessage.create({
        data: { postId, userId },
        select: { id: true, createdAt: true, postId: true },
      });

      const createMatchUseCase = new CreateMatchUseCase();
      await createMatchUseCase.execute(userId, postExists.userId);

      return this.createWatchVideoResponse(`Post curtido com sucesso.`);
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

  private createWatchVideoResponse(
    message: string,
  ): CreateLikePostMessageResponse {
    return {
      type: ["WATCH_VIDEO", "AI_SUGGESTION"],
      mustVideoWatch: true,
      awaitLikePostMessage: false,
      message,
    };
  }

  private createAiSuggestionResponse(
    message: string,
  ): CreateLikePostMessageResponse {
    return {
      type: ["AI_SUGGESTION"],
      mustVideoWatch: false,
      awaitLikePostMessage: true,
      message,
    };
  }

  private createSuccessResponse(
    message: string,
  ): CreateLikePostMessageResponse {
    return {
      type: ["POST"],
      mustVideoWatch: false,
      awaitLikePostMessage: false,
      message,
    };
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

    let state: RewardState = {
      totalLikes:
        redisTotalLikes !== null
          ? redisTotalLikes
          : CreateLikePostMessageUseCase.FREE_LIKE_LIMIT.toString(),
      mustWatchVideo:
        redisMustWatch !== null ? redisMustWatch === "true" : false,
      rewardWatchCount:
        redisRewardWatchCount !== null ? redisRewardWatchCount : "0",
      extraLikePostMessage:
        redisRewardLikesAvailable !== null ? redisRewardLikesAvailable : "0",
      limitReached:
        redisLimitReached !== null ? redisLimitReached === "true" : false,
      cycleExpiresAt: redisCycleExpiresAt !== null ? redisCycleExpiresAt : null,
    };

    // Reset após expiração
    if (state.cycleExpiresAt && new Date() > new Date(state.cycleExpiresAt)) {
      state = {
        totalLikes: CreateLikePostMessageUseCase.FREE_LIKE_LIMIT.toString(), // Após expiração, volta para 20 curtidas
        mustWatchVideo: false,
        rewardWatchCount: "0",
        extraLikePostMessage: "0",
        limitReached: false,
        cycleExpiresAt: null,
      };
      await this.persistRewardState(userId, state);
    }

    await this.syncRedisState(userId, state);
    return state;
  }

  private async persistRewardState(userId: string, state: RewardState) {
    await prisma.rewardTracking.update({
      where: { userId },
      data: {
        totalLikes: Number(state.totalLikes),
        mustWatchVideoReword: state.mustWatchVideo,
        rewardWatchCount: Number(state.rewardWatchCount),
        rewardLikesAvailable: Number(state.extraLikePostMessage),
        limitReached: state.limitReached,
        cycleExpiresAt: state.cycleExpiresAt
          ? new Date(state.cycleExpiresAt)
          : null,
      },
    });

    await this.syncRedisState(userId, state);
  }

  // Atualiza o Redis com o estado atual
  private async syncRedisState(userId: string, state: RewardState) {
    const ttl = state.cycleExpiresAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(state.cycleExpiresAt).getTime() - Date.now()) / 1000,
          ),
        )
      : undefined;

    const commands: Array<Promise<unknown>> = [
      redisClient.set(`countLikePostMessage:${userId}`, state.totalLikes),
      redisClient.set(`mustVideoWatch:${userId}`, String(state.mustWatchVideo)),
      redisClient.set(`rewardWatchCount:${userId}`, state.rewardWatchCount),
      redisClient.set(
        `rewardLikesAvailable:${userId}`,
        state.extraLikePostMessage,
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
        redisClient.set(`cycleExpiresAt:${userId}`, state.cycleExpiresAt),
        redisClient.expire(`cycleExpiresAt:${userId}`, ttl),
      );
    }

    await Promise.all(commands);
  }
}
