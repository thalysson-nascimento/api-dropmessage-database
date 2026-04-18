import { getImageUrl } from "../../../../service/cloudinary.service";
import { ListChatRepository } from "./getListChatRepository";

export class GetListChatUseCase {
  private repository: ListChatRepository;
  constructor() {
    this.repository = new ListChatRepository();
  }

  async execute(userId: string) {
    // const baseUrlAvatar = `${process.env.BASE_URL}/image/user-avatar`;

    const matches = await this.repository.getChats(userId);

    return matches.map((match) => {
      if (match.initiatorId === userId) {
        // Usuário autenticado é o iniciador, retorna o destinatário
        return {
          matchId: match.id,
          // hashPublicId: match.recipient.userHashPublic,
          message: `you: ${match.Message[0]?.content || ""}`,
          name: match.recipient.name,
          avatar: getImageUrl(
            match.recipient.avatar?.image || "",
            match.recipient.avatar?.version || 0,
          ),
          userLocation: match.recipient.UserLocation,
        };
      } else {
        // Usuário autenticado é o destinatário, retorna o iniciador
        return {
          matchId: match.id,
          // hashPublicId: match.initiator.userHashPublic,
          message: match.Message[0]?.content || "",
          name: match.initiator.name,
          avatar: getImageUrl(
            match.initiator.avatar?.image || "",
            match.initiator.avatar?.version || 0,
          ),
          userLocation: match.recipient.UserLocation,
        };
      }
    });
  }
}
