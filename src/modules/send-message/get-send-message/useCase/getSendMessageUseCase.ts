import { getImageUrl } from "../../../../service/cloudinary.service";
import { GetSendMessageRepository } from "./getSendMessageRepository";

export class GetSendMessageUseCase {
  private repository = new GetSendMessageRepository();

  async execute(matchId: string, userId: string, page = 1, limit = 15) {
    const match = await this.repository.getMatchWithUsers(matchId);

    if (!match) {
      throw new Error("Match não encontrado");
    }

    // 🔐 VALIDAÇÃO CRÍTICA
    const isParticipant =
      match.initiatorId === userId || match.recipientId === userId;

    if (!isParticipant) {
      throw new Error("Acesso não autorizado a este match");
    }

    const otherUser =
      match.initiatorId === userId ? match.recipient : match.initiator;

    const skip = (page - 1) * limit;

    const [messages, totalMessages, onlineStatus] = await Promise.all([
      this.repository.getMessages(matchId, skip, limit),
      this.repository.countMessages(matchId),
      this.repository.getOnlineStatus(otherUser.id),
    ]);

    const formattedMessages = messages.map((msg) => {
      const isOwn = msg.user.id === userId;

      return {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        time: this.formatTime(msg.createdAt),
        dateLabel: this.getDateLabel(msg.createdAt),
        isOwnMessage: isOwn,
        user: {
          userHashPublic: msg.user.userHashPublic,
          name: msg.user.name,
          avatar: getImageUrl(msg.user.avatar?.image || ""),
        },
      };
    });

    return {
      match: {
        id: match.id,
        otherUser: {
          userHashPublic: otherUser.userHashPublic,
          name: otherUser.name,
          avatar: getImageUrl(otherUser.avatar?.image || ""),
          isOnline: onlineStatus?.isOnline || false,
          lastSeen: onlineStatus?.lastSeen,
        },
      },
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
        hasMore: page * limit < totalMessages,
      },
      messages: formattedMessages,
    };
  }

  private formatTime(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  private getDateLabel(date: Date) {
    const today = new Date();
    const oneDay = 1000 * 60 * 60 * 24;

    const diff = Math.floor(
      (today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) /
        oneDay,
    );

    if (diff === 0) return "Hoje";
    if (diff === 1) return "Ontem";

    return new Intl.DateTimeFormat("pt-BR").format(date);
  }
}
