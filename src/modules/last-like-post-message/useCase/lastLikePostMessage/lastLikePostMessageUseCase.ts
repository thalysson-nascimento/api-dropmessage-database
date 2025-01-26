import { LastLikePostMessageRepository } from "./lastLikePostMessageRepository";

export class LastLikePostMessageUseCase {
  private repository: LastLikePostMessageRepository;

  constructor() {
    this.repository = new LastLikePostMessageRepository();
  }

  async execute(userId: string) {
    let praseLikePostMessage = null;
    let countLike: string = "";
    const lastLikePostMessage = await this.repository.lastLikePostMessage(
      userId
    );

    if (lastLikePostMessage?.user?.avatar?.image) {
      const cloudinaryUrl = lastLikePostMessage.user.avatar.image;
      const blurredImageUrl = cloudinaryUrl.replace(
        "/upload/",
        "/upload/e_blur:2000/"
      );
      lastLikePostMessage.user.avatar.image = blurredImageUrl;
    }

    const countLikePostMessage = await this.repository.totalLikeMessage(userId);

    if (countLikePostMessage < 10) {
      praseLikePostMessage = "Assine nosso plano e veja quem curtiu você!";
      countLike = `${countLikePostMessage}`;
    } else {
      const roundedCount = Math.ceil(countLikePostMessage / 10) * 10;
      countLike = `+${roundedCount - 10}`;
      praseLikePostMessage = `Mais de ${roundedCount - 10} curtiram você!`;
    }

    return {
      praseLikePostMessage,
      countLike,
      lastLikePostMessage,
    };
  }
}
