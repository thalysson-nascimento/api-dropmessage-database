import createHttpError from "http-errors";
import { CreateMatchUseCase } from "../../../match/create-match/useCase/createMatchUseCase";
import { CreateNotificationUseCase } from "../../../notification/create-notification/useCase/createNotificationUseCase";
import { InteractionsRepository } from "./InteractionsRepository";

interface IRequest {
  actorId: string;
  targetType: "POST" | "USER";
  targetId: string; // postId ou userHashPublic
  type: "LIKE" | "COMMENT";
}

export class InteractionsUseCase {
  private repository = new InteractionsRepository();

  async execute({ actorId, targetType, targetId, type }: IRequest) {
    let targetUserId: string | null = null;
    let postId: string | null = null;

    // ============================================
    // 🔎 1. Resolver target
    // ============================================

    if (targetType === "POST") {
      const post = await this.repository.findPostById(targetId);

      if (!post) {
        throw createHttpError(404, "Post não encontrado");
      }

      if (post.isExpired) {
        throw createHttpError(409, "Post expirado");
      }

      targetUserId = post.userId;
      postId = post.id;
    }

    if (targetType === "USER") {
      const user = await this.repository.findUserByHash(targetId);

      if (!user) {
        throw createHttpError(404, "Usuário não encontrado");
      }

      targetUserId = user.id;
    }

    if (!targetUserId) {
      throw createHttpError(400, "Target inválido");
    }

    // ============================================
    // 🚫 Não pode interagir consigo mesmo
    // ============================================

    if (actorId === targetUserId) {
      throw createHttpError(400, "Você não pode interagir com você mesmo");
    }

    // ============================================
    // 🔐 REGRA DE PERMISSÃO
    // ============================================

    await this.validateInteractionPermission(actorId, targetUserId);

    // ============================================
    // 🎯 COMPORTAMENTO BASEADO NO TYPE
    // ============================================

    switch (type) {
      case "LIKE":
        await this.handleLike(actorId, targetUserId, targetType, postId);
        break;

      case "COMMENT":
        await this.handleComment(actorId, targetUserId, targetType, postId);
        break;

      default:
        throw createHttpError(400, "Tipo de interação inválido");
    }

    return {
      success: true,
      message: `Interação ${type} realizada com sucesso`,
    };
  }

  // ============================================
  // ❤️ LIKE
  // ============================================

  private async handleLike(
    actorId: string,
    targetUserId: string,
    targetType: "POST" | "USER",
    postId: string | null,
  ) {
    if (targetType === "POST") {
      await this.repository.createLikePost(postId!, actorId);
    }

    if (targetType === "USER") {
      await this.repository.createLikeUser(actorId, targetUserId);
    }

    // 🔔 Notificação
    const notificationUseCase = new CreateNotificationUseCase();

    await notificationUseCase.execute({
      notifiedUserId: targetUserId,
      actorId,
      type: "LIKE",
      postId: postId || undefined,
    });

    // 💘 Match
    const matchUseCase = new CreateMatchUseCase();
    await matchUseCase.execute(actorId, targetUserId);
  }

  // ============================================
  // 💬 COMMENT
  // ============================================

  private async handleComment(
    actorId: string,
    targetUserId: string,
    targetType: "POST" | "USER",
    postId: string | null,
  ) {
    // 👉 Aqui você NÃO cria like

    // 🔔 Notificação de comentário
    const notificationUseCase = new CreateNotificationUseCase();

    await notificationUseCase.execute({
      notifiedUserId: targetUserId,
      actorId,
      type: "COMMENT",
      postId: postId || undefined,
    });

    // 💘 Mesmo sem like, pode gerar match
    const matchUseCase = new CreateMatchUseCase();
    await matchUseCase.execute(actorId, targetUserId);
  }

  // ============================================
  // 🔐 VALIDAÇÃO
  // ============================================

  private async validateInteractionPermission(
    actorId: string,
    targetUserId: string,
  ) {
    if (actorId === targetUserId) {
      throw createHttpError(400, "Você não pode interagir com você mesmo");
    }

    const [hasNotification, hasLikePost, hasLikeUser] = await Promise.all([
      this.repository.hasNotificationBetweenUsers(actorId, targetUserId),
      this.repository.hasLikePostBetweenUsers(actorId, targetUserId),
      this.repository.hasLikeUserBetweenUsers(actorId, targetUserId),
    ]);

    const isAllowed = hasNotification || hasLikePost || hasLikeUser;

    if (!isAllowed) {
      throw createHttpError(
        403,
        "Interação não permitida. Este usuário não está disponível para interação.",
      );
    }

    return true;
  }
}
