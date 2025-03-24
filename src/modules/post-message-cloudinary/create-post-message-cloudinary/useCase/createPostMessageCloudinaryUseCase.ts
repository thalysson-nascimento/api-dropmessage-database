import { randomBytes } from "crypto";
import { addDays, addHours, addMinutes } from "date-fns";
import path from "path";
import { client as redisClient } from "../../../../lib/redis";
import { CreatePostMessageCloudinaryRepository } from "./createPostMessageCloudinaryRepository";

export class CreatePostMessageCloudinaryUseCase {
  private repository: CreatePostMessageCloudinaryRepository;

  constructor() {
    this.repository = new CreatePostMessageCloudinaryRepository();
  }

  async execute(
    userId: string,
    expirationTimer: string,
    file: Express.Multer.File
  ) {
    let expirationDate: Date = new Date();
    let expirationInSeconds;

    switch (expirationTimer) {
      case "addThirtyMin":
        console.log("thirtyMin");
        expirationDate = addMinutes(expirationDate, 30);
        expirationInSeconds = 30 * 60; // 30 minutos em segundos

        break;
      case "addOneHour":
        console.log("addOneHour");
        expirationDate = addHours(expirationDate, 1);
        expirationInSeconds = 60 * 60; // 60 minutos em segundos

        break;
      case "addOneday":
        console.log("addOneday");
        expirationDate = addDays(expirationDate, 1);
        expirationInSeconds = 24 * 60 * 60; // 24 horas em segundos

        break;
      default:
        throw new Error(
          "Valor inválido para timerExpiration. Os valores permitidos são addThirtyMin, addOneHour e addOneday"
        );
    }

    const extension = path.extname(file.originalname);
    const hash = randomBytes(16).toString("hex");
    const hashedFileName = `${hash}${extension}`;

    file.originalname = hashedFileName;

    const post = await this.repository.createPostMessageCloudinary(
      userId,
      expirationDate,
      expirationTimer,
      file
    );

    await redisClient.setEx(
      `post:${post.id}`,
      expirationInSeconds,
      JSON.stringify(post)
    );

    return await this.activeGoldPlanTrial(userId, post);
  }

  private async activeGoldPlanTrial(userId: string, post: any) {
    const activePlanGoldFreeTrial =
      await this.repository.adminActivePlanGoldFreeTrial();

    if (activePlanGoldFreeTrial?.activePlan) {
      const userFirstPublicationPosMessage =
        await this.repository.userFirstPublicationPosMessage(userId);
      if (!userFirstPublicationPosMessage?.firstPublicationPostMessage) {
        return {
          firstPublicationPostMessage:
            userFirstPublicationPosMessage?.firstPublicationPostMessage,
          post,
        };
      }
    }

    return {
      post: post,
    };
  }
}
