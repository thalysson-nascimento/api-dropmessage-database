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
          mathId: match.id,
          // hashPublicId: match.recipient.userHashPublic,
          name: match.recipient.name,
          avatar: match.recipient.avatar?.image,
          userLocation: match.recipient.UserLocation,
        };
      } else {
        // Usuário autenticado é o destinatário, retorna o iniciador
        return {
          mathId: match.id,
          // hashPublicId: match.initiator.userHashPublic,
          name: match.initiator.name,
          avatar: match.initiator.avatar?.image,
          userLocation: match.recipient.UserLocation,
        };
      }
    });
  }
}
