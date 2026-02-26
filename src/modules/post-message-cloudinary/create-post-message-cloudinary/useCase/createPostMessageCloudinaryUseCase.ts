import { randomBytes } from "crypto";
import path from "path";
import clientStripe from "../../../../config/stripe.config";
import { client as redisClient } from "../../../../lib/redis";
import {
  generateAuthenticatedImageUrl,
  uploadAuthenticatedImage,
} from "../../../../service/cloudinary.service";
import { CreatePostMessageCloudinaryRepository } from "./createPostMessageCloudinaryRepository";
import { ExpirationTimer, expirationMap } from "./domain/expiration.config";

interface PostMessage {
  expirationTimer: string;
  expirationDate: Date;
  file: Express.Multer.File;
  sharedPostSuccess?: boolean;
  expirationInSeconds: number;
  expirationUnit: "minute" | "hour" | "day";
  expirationAmount: number;
  planGoldFreeTrialCongratulations?: boolean;
  uploadClaoudinary: any;
  showADS?: boolean;
  postMessageBlur: string;
  listActivePost?: {
    image: string;
    fileName: string;
    expirationTimer: Date;
  }[];
}

export class CreatePostMessageCloudinaryUseCase {
  private repository: CreatePostMessageCloudinaryRepository;

  constructor() {
    this.repository = new CreatePostMessageCloudinaryRepository();
  }

  async execute(
    userId: string,
    expirationTimer: ExpirationTimer,
    file: Express.Multer.File
  ) {
    const postMap = expirationMap[expirationTimer];

    if (!postMap) {
      throw new Error("Timer inválido");
    }

    const expirationDate = postMap.add(new Date());

    const extension = path.extname(file.originalname);
    const hash = randomBytes(16).toString("hex");
    const hashedFileName = `${hash}${extension}`;

    file.originalname = hashedFileName;

    // OBS: no banco deve salvar somente o public_id ===> para o banco image: uploadClaoudinary.public_id
    const uploadClaoudinary = await uploadAuthenticatedImage(file);

    // aqui só simulamos como não premium
    const postMessageBlur = generateAuthenticatedImageUrl(
      uploadClaoudinary.public_id,
      false // false = blur
    );

    const post: PostMessage = {
      expirationDate,
      expirationTimer,
      expirationInSeconds: postMap.seconds,
      expirationAmount: postMap.amount,
      expirationUnit: postMap.unit,
      file,
      uploadClaoudinary,
      postMessageBlur,
    };
    const postMessage = await this.repository.createPostMessageCloudinary(
      userId,
      expirationDate,
      expirationTimer,
      file
    );

    await redisClient.setEx(
      `post:${postMessage.id}`,
      postMap.seconds,
      JSON.stringify(post)
    );

    const subscription = await this.repository.getUserSubscription(userId);
    const activePost = await this.repository.findActivePostsByUser(userId);

    if (!subscription) {
      // NÃO TEM ASSINATURA
      const activePlanGoldFreeTrial =
        await this.repository.adminActivePlanGoldFreeTrial();
      if (activePlanGoldFreeTrial) {
        await this.subscriptionGoldFreeTrial(userId);
        await this.repository.createSubscriptionGoldFreeTrialByUser(userId);
        post.planGoldFreeTrialCongratulations = true;
        post.listActivePost = activePost;
      } else {
        post.listActivePost = activePost;
        post.sharedPostSuccess = true;
        post.showADS = true;
      }
    } else if (
      subscription.status !== "active" &&
      subscription.status !== "trialing"
    ) {
      // TEM ASSINATURA MAS NÃO ESTÁ ATIVA
      post.listActivePost = activePost;
      post.sharedPostSuccess = true;
      post.showADS = true;
    } else {
      // TEM ASSINATURA ATIVA
      // post.premiumUser = true;
      post.listActivePost = activePost;
      post.sharedPostSuccess = true;
    }

    return post;
  }

  async subscriptionGoldFreeTrial(userId: string) {
    const userStripeId = await this.repository.userStripeCustomerId(userId);
    const priceId = process.env.PRICEID_GOLD_FREE_TRIAL as string;
    console.log("priceId", priceId);

    if (userStripeId) {
      await clientStripe.subscriptions.create({
        customer: userStripeId.customerId,
        items: [{ price: priceId }],
        coupon: "free_trial_7_days",
        trial_period_days: 7,
        payment_behavior: "default_incomplete",
        trial_settings: {
          end_behavior: {
            missing_payment_method: "cancel",
          },
        },
        metadata: {
          userId,
          priceId,
        },
      });
    }
  }
}
