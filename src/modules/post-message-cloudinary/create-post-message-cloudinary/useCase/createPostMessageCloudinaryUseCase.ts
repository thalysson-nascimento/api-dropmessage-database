import { randomBytes } from "crypto";
import path from "path";
import clientStripe from "../../../../config/stripe.config";
import { client as redisClient } from "../../../../lib/redis";
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
    file: Express.Multer.File
  ) {
    const config = expirationMap[expirationTimer];

    if (!config) {
      throw new Error("Timer inválido");
    }

    const expirationDate = config.add(new Date());

    const extension = path.extname(file.originalname);
    const hash = randomBytes(16).toString("hex");
    const hashedFileName = `${hash}${extension}`;

    file.originalname = hashedFileName;

    const post: PostMessage = {
      expirationDate,
      expirationTimer,
      expirationInSeconds: config.seconds,
      expirationAmount: config.amount,
      expirationUnit: config.unit,
      file,
    };

    const postMessage = await this.repository.createPostMessageCloudinary(
      userId,
      expirationDate,
      expirationTimer,
      file
    );

    await redisClient.setEx(
      `post:${postMessage.id}`,
      config.seconds,
      JSON.stringify(post)
    );

    // TODO: obrigatório verificar se é a primeira postagem ou nao do usuário
    // esse fluxo deve ser implementado
    // pq possa ser que o gold free trial esteja desativado e ai ele vai fazermais de uma postagem
    // e quando ativar ele vai termais de uma postagem e vai redirecionar no front
    // como se fosse primeira postagem, quebrando assim entao o fluxo da ideia no app
    // atenção aplicar esse fluxo da verificação da postagem

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
