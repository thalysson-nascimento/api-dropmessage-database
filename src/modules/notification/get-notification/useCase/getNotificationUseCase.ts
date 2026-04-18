import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NotificationTypeEnum } from "../../../../enums/notification.enum";
import { GetNotificationResponse } from "../../../../interfaces/notification.interface";
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

    const actorIds = notifications.map((n) => n.actor.id);

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

        case NotificationTypeEnum.COMMENT:
          meta = {
            commentText: (notification as any).commentText ?? null,
          };
          break;
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
