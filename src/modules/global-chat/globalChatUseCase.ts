import { GlobalChatMessageType } from "@prisma/client";
import createHttpError from "http-errors";
import {
  deleteAuthenticatedImage,
  getImageUrl,
  uploadAuthenticatedImage,
} from "../../service/cloudinary.service";
import { GlobalChatRepository } from "./globalChatRepository";

const MIN_IMAGE_EXPIRATION_SECONDS = 60;
const MAX_IMAGE_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "1";
}

function formatReactions(
  reactions: { emotion: string; userId: string }[],
  userId: string,
) {
  const grouped = new Map<
    string,
    { emotion: string; count: number; reactedByMe: boolean }
  >();

  for (const reaction of reactions) {
    const current = grouped.get(reaction.emotion);
    if (current) {
      current.count += 1;
      current.reactedByMe ||= reaction.userId === userId;
    } else {
      grouped.set(reaction.emotion, {
        emotion: reaction.emotion,
        count: 1,
        reactedByMe: reaction.userId === userId,
      });
    }
  }

  return Array.from(grouped.values());
}

function serializeMessage(
  message: any,
  userId: string,
  revealViewOnce = false,
) {
  const currentView = message.views?.find(
    (view: any) => view.userId === userId,
  );
  const hasBeenRead = Boolean(currentView);
  const canRevealImage =
    !message.viewOnce ||
    (message.userId !== userId && revealViewOnce);
  const viewOnceReaders = (message.views ?? []).map((view: any) => ({
    id: view.user.userHashPublic,
    name: view.user.name,
    avatarUrl: view.user.avatar?.image
      ? getImageUrl(
          view.user.avatar.image,
          view.user.avatar.version ?? undefined,
        )
      : null,
    viewedAt: view.viewedAt,
  }));

  return {
    id: message.id,
    type: message.type,
    content: message.content,
    imageUrl:
      message.image && canRevealImage ? getImageUrl(message.image) : null,
    fileName: canRevealImage ? message.fileName : null,
    isViewOncePreview: message.viewOnce && !canRevealImage,
    viewOnceStatus: message.viewOnce
      ? hasBeenRead || viewOnceReaders.length > 0
        ? "READ"
        : "PENDING"
      : null,
    viewOnceReaders,
    viewOnce: message.viewOnce,
    expiresAt: message.expiresAt,
    createdAt: message.createdAt,
    isMine: message.userId === userId,
    author: {
      id: message.user.userHashPublic,
      name: message.user.name,
      avatarUrl: message.user.avatar?.image
        ? getImageUrl(
            message.user.avatar.image,
            message.user.avatar.version ?? undefined,
          )
        : null,
    },
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          type: message.replyTo.type,
          content: message.replyTo.content,
          author: message.replyTo.user,
        }
      : null,
    reactions: formatReactions(message.reactions ?? [], userId),
    commentsCount: message._count?.comments ?? 0,
  };
}

export class GlobalChatUseCase {
  private repository = new GlobalChatRepository();

  async createMessage(input: {
    userId: string;
    content?: string;
    file?: Express.Multer.File;
    viewOnce?: unknown;
    expiresInSeconds?: unknown;
    replyToId?: string;
  }) {
    const content = input.content?.trim();
    if (!content && !input.file) {
      throw createHttpError(400, "Informe uma mensagem ou envie uma imagem");
    }

    if (input.replyToId) {
      const reply = await this.repository.findReply(input.replyToId);
      if (!reply || reply.deletedAt) {
        throw createHttpError(404, "Mensagem de referência não encontrada");
      }
    }

    const isImage = Boolean(input.file);
    const viewOnce = parseBoolean(input.viewOnce);
    let expiresAt: Date | undefined;

    if (isImage) {
      const expiration = Number(input.expiresInSeconds ?? 24 * 60 * 60);
      if (
        !Number.isInteger(expiration) ||
        expiration < MIN_IMAGE_EXPIRATION_SECONDS ||
        expiration > MAX_IMAGE_EXPIRATION_SECONDS
      ) {
        throw createHttpError(
          400,
          `expiresInSeconds deve estar entre ${MIN_IMAGE_EXPIRATION_SECONDS} e ${MAX_IMAGE_EXPIRATION_SECONDS}`,
        );
      }
      expiresAt = new Date(Date.now() + expiration * 1000);
    } else if (viewOnce || input.expiresInSeconds) {
      throw createHttpError(
        400,
        "Visualização única e expiração só estão disponíveis para imagens",
      );
    }

    let image: string | undefined;
    if (input.file) {
      const uploaded = await uploadAuthenticatedImage(input.file);
      image = uploaded.public_id;
    }

    try {
      const message = await this.repository.createMessage({
        userId: input.userId,
        type: isImage
          ? GlobalChatMessageType.IMAGE
          : GlobalChatMessageType.TEXT,
        content: content || undefined,
        image,
        fileName: input.file?.originalname,
        format: input.file?.mimetype.split("/")[1],
        optimizedSize: input.file?.size,
        viewOnce,
        expiresAt,
        replyToId: input.replyToId,
      });

      return serializeMessage(message, input.userId);
    } catch (error) {
      if (image) await deleteAuthenticatedImage(image).catch(() => undefined);
      throw error;
    }
  }

  async listMessages(userId: string, limitInput?: string, cursor?: string) {
    const limit = Math.min(Math.max(Number(limitInput) || 15, 1), 15);
    const rows = await this.repository.listMessages(userId, limit, cursor);
    const hasMore = rows.length > limit;
    const messages = (hasMore ? rows.slice(0, limit) : rows).map((row) =>
      serializeMessage(row, userId),
    );

    return {
      messages,
      nextCursor: hasMore ? rows[limit - 1].id : null,
    };
  }

  async toggleReaction(
    messageId: string,
    userId: string,
    emotionInput: unknown,
  ) {
    const emotion = String(emotionInput ?? "").trim();
    if (!emotion || emotion.length > 32) {
      throw createHttpError(
        400,
        "emotion é obrigatório e deve ter até 32 caracteres",
      );
    }

    const message = await this.repository.findMessage(messageId);
    if (
      !message ||
      message.deletedAt ||
      (message.expiresAt && message.expiresAt <= new Date())
    ) {
      throw createHttpError(404, "Mensagem não encontrada ou expirada");
    }

    const reaction = await this.repository.findReaction(
      messageId,
      userId,
      emotion,
    );
    if (reaction) {
      await this.repository.deleteReaction(messageId, userId, emotion);
    } else {
      await this.repository.createReaction(messageId, userId, emotion);
    }

    const updated = await this.repository.findMessage(messageId);
    return {
      messageId,
      emotion,
      reacted: !reaction,
      reactions: formatReactions(updated?.reactions ?? [], userId),
    };
  }

  async createComment(
    messageId: string,
    userId: string,
    contentInput: unknown,
    replyToId?: string,
  ) {
    const content = String(contentInput ?? "").trim();
    if (!content || content.length > 2000) {
      throw createHttpError(
        400,
        "content é obrigatório e deve ter até 2000 caracteres",
      );
    }

    const message = await this.repository.findMessage(messageId);
    if (
      !message ||
      message.deletedAt ||
      (message.expiresAt && message.expiresAt <= new Date())
    ) {
      throw createHttpError(404, "Mensagem não encontrada ou expirada");
    }

    if (replyToId) {
      const reply = await this.repository.findComment(replyToId);
      if (!reply || reply.messageId !== messageId) {
        throw createHttpError(404, "Comentário de referência não encontrado");
      }
    }

    const comment = await this.repository.createComment({
      messageId,
      userId,
      content,
      replyToId,
    });
    return {
      id: comment.id,
      messageId,
      content: comment.content,
      createdAt: comment.createdAt,
      isMine: true,
      author: {
        id: comment.user.userHashPublic,
        name: comment.user.name,
        avatarUrl: comment.user.avatar?.image
          ? getImageUrl(
              comment.user.avatar.image,
              comment.user.avatar.version ?? undefined,
            )
          : null,
      },
    };
  }

  async listComments(messageId: string, userId: string) {
    const message = await this.repository.findMessage(messageId);
    if (
      !message ||
      message.deletedAt ||
      (message.expiresAt && message.expiresAt <= new Date())
    ) {
      throw createHttpError(404, "Mensagem não encontrada ou expirada");
    }

    const comments = await this.repository.listComments(messageId);
    return comments.map((comment) => ({
      id: comment.id,
      messageId: comment.messageId,
      content: comment.content,
      replyToId: comment.replyToId,
      createdAt: comment.createdAt,
      isMine: comment.userId === userId,
      author: {
        id: comment.user.userHashPublic,
        name: comment.user.name,
        avatarUrl: comment.user.avatar?.image
          ? getImageUrl(
              comment.user.avatar.image,
              comment.user.avatar.version ?? undefined,
            )
          : null,
      },
    }));
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.repository.findMessage(messageId);
    if (!message) throw createHttpError(404, "Mensagem não encontrada");
    if (message.userId !== userId)
      throw createHttpError(403, "Você só pode apagar suas próprias mensagens");

    await this.repository.deleteMessage(messageId, userId);
    if (message.image)
      await deleteAuthenticatedImage(message.image).catch(() => undefined);
    return { messageId, deleted: true };
  }

  async markViewed(messageId: string, userId: string) {
    const message = await this.repository.findMessage(messageId);
    if (!message || message.deletedAt)
      throw createHttpError(404, "Mensagem não encontrada");
    if (!message.viewOnce)
      throw createHttpError(400, "Essa mensagem não é de visualização única");
    if (message.userId === userId)
      throw createHttpError(
        400,
        "O autor não precisa abrir a própria mensagem",
      );
    if (message.expiresAt && message.expiresAt <= new Date())
      throw createHttpError(404, "Mensagem não encontrada ou expirada");
    if (message.views?.some((view: any) => view.userId === userId))
      throw createHttpError(409, "Essa imagem já foi visualizada por você");

    const { message: viewedMessage, created } =
      await this.repository.markViewed(messageId, userId);
    if (!created)
      throw createHttpError(409, "Essa imagem já foi visualizada por você");
    if (!viewedMessage) throw createHttpError(404, "Mensagem não encontrada");

    const reader = viewedMessage.views[0];
    return {
      message: serializeMessage(viewedMessage, userId, true),
      readEvent: {
        messageId,
        viewOnceStatus: "READ",
        reader: reader
          ? {
              id: reader.user.userHashPublic,
              name: reader.user.name,
              avatarUrl: reader.user.avatar?.image
                ? getImageUrl(
                    reader.user.avatar.image,
                    reader.user.avatar.version ?? undefined,
                  )
                : null,
              viewedAt: reader.viewedAt,
            }
          : null,
      },
    };
  }
}
