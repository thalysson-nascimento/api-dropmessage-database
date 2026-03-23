import { randomBytes } from "crypto";
import path from "path";
import clientStripe from "../../../../config/stripe.config";
import { client as redisClient } from "../../../../lib/redis";
import {
  getImageUrl,
  uploadAuthenticatedImage,
} from "../../../../service/cloudinary.service";
import { CreatePostMessageCloudinaryRepository } from "./createPostMessageCloudinaryRepository";
import { ExpirationTimer, expirationMap } from "./domain/expiration.config";

interface PostMessage {
  expirationTimer: string;
  expirationDate: Date;
  sharedPostSuccess?: boolean;
  expirationInSeconds: number;
  expirationUnit: "minute" | "hour" | "day";
  expirationAmount: number;
  planGoldFreeTrialCongratulations?: boolean;
  showADS?: boolean;
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
    file: Express.Multer.File,
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
    const { public_id } = uploadClaoudinary;

    // aqui só simulamos como não premium
    // const postMessageBlur = generateAuthenticatedImageUrl(
    //   uploadClaoudinary.public_id,
    //   false // false = blur
    // );

    const postMessage = await this.repository.createPostMessageCloudinary(
      userId,
      expirationDate,
      expirationTimer,
      file,
      public_id,
    );

    const subscription = await this.repository.getUserSubscription(userId);
    const activePost = await this.repository.findActivePostsByUser(userId);

    const post: PostMessage = {
      expirationDate,
      expirationTimer,
      expirationInSeconds: postMap.seconds,
      expirationAmount: postMap.amount,
      expirationUnit: postMap.unit,
      listActivePost: activePost.map((post) => ({
        ...post,
        image: getImageUrl(post.image),
      })),
    };

    await redisClient.setEx(
      `post:${postMessage.id}`,
      postMap.seconds,
      JSON.stringify(post),
    );

    if (!subscription) {
      const activePlanGoldFreeTrial =
        await this.repository.adminActivePlanGoldFreeTrial();

      if (activePlanGoldFreeTrial) {
        const alreadyHasFreeTrial =
          await this.repository.findSubscriptionGoldFreeTrialByUser(userId);

        if (!alreadyHasFreeTrial) {
          // só cria se NÃO existir
          await this.subscriptionGoldFreeTrial(userId);
          await this.repository.createSubscriptionGoldFreeTrialByUser(userId);

          post.planGoldFreeTrialCongratulations = true;
        } else {
          // já usou o trial antes
          post.sharedPostSuccess = true;
          post.showADS = true;
        }
      } else {
        post.sharedPostSuccess = true;
        post.showADS = true;
      }
    } else if (
      subscription.status !== "active" &&
      subscription.status !== "trialing"
    ) {
      // TEM ASSINATURA MAS NÃO ESTÁ ATIVA
      post.sharedPostSuccess = true;
      post.showADS = true;
    } else {
      // TEM ASSINATURA ATIVA
      // post.premiumUser = true;
      post.sharedPostSuccess = true;
    }

    return post;
  }

  async subscriptionGoldFreeTrial(userId: string) {
    const userStripeId = await this.repository.userStripeCustomerId(userId);
    const priceId = process.env.PRICEID_GOLD_FREE_TRIAL as string;

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
