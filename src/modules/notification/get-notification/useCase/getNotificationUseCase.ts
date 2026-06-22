import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NotificationTypeEnum } from "../../../../enums/notification.enum";
import { GetNotificationResponse } from "../../../../interfaces/notification.interface";
import { getSocketIO } from "../../../../lib/socket";
import {
  generateAuthenticatedImageUrl,
  getImageUrl,
} from "../../../../service/cloudinary.service";
import { GetNotificationRepository } from "./getNotificationRepository";

export class GetNotificationUseCase {
  private repository = new GetNotificationRepository();

  async execute(userId: string): Promise<GetNotificationResponse> {
    const subscription = await this.repository.findActiveSubscription(userId);
    const isPremium = !!subscription;

    const notifications = await this.repository.findByRecipient(userId);

    // ✅ MARCA TODAS COMO LIDAS E NOTIFICA O SOCKET
    await this.repository.markAllAsRead(userId);

    try {
      const io = getSocketIO();
      io.to(userId).emit("notification:unread", {
        count: 0,
        hasUnread: false,
      });
    } catch (error) {
      console.error("Erro ao notificar socket de leitura total:", error);
    }

    const actorIds = notifications.map((n) => n.actor.id);

    // ✅ BUSCA COMENTARIOS PARA AS NOTIFICACOES DE COMENTARIO
    const commentNotifications = notifications.filter(
      (n) => n.type === NotificationTypeEnum.COMMENT && n.postId
    );

    const commentMap = new Map<string, string>();
    if (commentNotifications.length > 0) {
      const commentPostIds = commentNotifications.map((n) => n.postId as string);
      const commentActorIds = commentNotifications.map((n) => n.actor.id);

      console.log("commentPostIds:", commentPostIds);
      console.log("commentActorIds:", commentActorIds);

      const comments = await this.repository.findCommentsForNotifications(
        commentPostIds,
        commentActorIds,
      );

      console.log("Found comments from DB:", comments);

      comments.forEach((c) => {
        const key = `${c.postId}_${c.userId}`;
        console.log(`Setting map key: ${key} -> ${c.content}`);
        if (!commentMap.has(key)) {
          commentMap.set(key, c.content);
        }
      });
    }

    // ✅ MATCH EM LOTE
    const matches = await this.repository.findMatchesBetweenUsers(
      userId,
      actorIds,
    );

    // ✅ MAPA DE MATCH
    const matchMap = new Map<
      string,
      {
        matchId: string;
        name: string;
        avatar: string | null;
        userLocation: {
          stateCode: string;
          city: string;
        } | null;
      }
    >();

    matches.forEach((match) => {
      const isInitiator = match.initiatorId === userId;
      const otherUser = isInitiator ? match.recipient : match.initiator;

      const avatar = otherUser.avatar;

      const avatarUrl = generateAuthenticatedImageUrl(
        avatar?.image ?? "",
        avatar?.version || undefined, // ✅ CORRIGIDO
        true, // ✅ TODOS OS AVATARES DEVEM SER PIXELADOS PARA PROTEGER A PRIVACIDADE
      );

      matchMap.set(otherUser.id, {
        matchId: match.id,
        name: otherUser.name,
        avatar: avatarUrl,
        userLocation: otherUser.UserLocation
          ? {
              stateCode: otherUser.UserLocation.stateCode,
              city: otherUser.UserLocation.city,
            }
          : null,
      });
    });

    const items = notifications.map((notification) => {
      const actorId = notification.actor.id;

      const matchData = matchMap.get(actorId);
      const hasMatch = !!matchData;

      const avatar = notification.actor.avatar;
      const canSeeAvatar = isPremium || hasMatch;

      const avatarUrl = generateAuthenticatedImageUrl(
        avatar?.image ?? "",
        avatar?.version || undefined,
        canSeeAvatar,
      );

      const thumbnailUrl = notification.post?.image
        ? getImageUrl(notification.post.image)
        : null;

      let meta = undefined;

      switch (notification.type) {
        case NotificationTypeEnum.LIKE:
          meta = { totalCount: 1 };
          break;

        case NotificationTypeEnum.COMMENT: {
          const lookupKey = `${notification.postId}_${notification.actor.id}`;
          const commentVal = commentMap.get(lookupKey);
          console.log(`Lookup key: ${lookupKey} -> value: ${commentVal}`);
          meta = {
            commentText: commentVal ?? undefined,
          };
          break;
        }
      }

      return {
        id: notification.id,
        type: notification.type as NotificationTypeEnum,
        subscription: isPremium,
        actors: [
          {
            id: actorId,
            name: notification.actor.name,
            avatarUrl,
          },
        ],
        target: notification.post
          ? {
              id: notification.post.id,
              type: "photo" as const,
              thumbnailUrl,
            }
          : null,
        meta,
        match: hasMatch,
        matchData: matchData ?? null,
        createdAt: formatDistanceToNow(notification.createdAt, {
          addSuffix: true,
          locale: ptBR,
        }),
        isRead: notification.isRead,
      };
    });

    return {
      subscription: isPremium,
      items,
    };
  }
}
