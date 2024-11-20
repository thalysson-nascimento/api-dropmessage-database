import createHttpError from "http-errors";
import { GetSendMessageRepository } from "./getSendMessageRepository";

export class GetSendMessageUseCase {
  private repository: GetSendMessageRepository;
  constructor() {
    this.repository = new GetSendMessageRepository();
  }

  async execute(matchId: string, userId: string, page = 1, limit = 10) {
    const existMatch = await this.repository.getMahctById(matchId);
    if (!existMatch) {
      throw createHttpError(404, "Match não encontrado");
    }

    const skip = (page - 1) * limit;

    const { messages, totalMessages } =
      await this.repository.getMessagesByMatchId(matchId, userId, skip, limit);

    if (!messages || messages.length === 0) {
      throw createHttpError(404, "Mensagens não encontradas.");
    }

    const pathImageFull = messages.map((message) => ({
      ...message,
      user: {
        ...message.user,
        avatar: {
          ...message.user.avatar,
          image: message.user.avatar?.image
            ? `${process.env.BASE_URL}/image/user-avatar/${message.user.avatar?.image}`
            : null,
        },
      },
    }));

    return {
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
      },
      messages: pathImageFull,
    };
  }
}
