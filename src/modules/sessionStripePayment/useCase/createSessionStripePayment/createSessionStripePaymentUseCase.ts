import createHttpError from "http-errors";
import clientStripe from "../../../../config/stripe.config";
import { CreateSessionStripePaymentRepository } from "./createSessionStripePaymentRepository";

const COUNTRY_TO_CURRENCY = {
  BR: "brl",
  US: "usd",
  EU: "eur",
};

export class CreateSessionStripePaymentUseCase {
  private repository: CreateSessionStripePaymentRepository;

  constructor() {
    this.repository = new CreateSessionStripePaymentRepository();
  }

  async execute(priceId: string, userId: string) {
    const userExist = await this.repository.userExists(userId);

    if (!userExist) {
      throw createHttpError(404, "Usuário não encontrado");
    }

    try {
      const session = await clientStripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.BASE_URL}/successsuccess`,
        cancel_url: `${process.env.BASE_URL}/cancel`,
        subscription_data: {
          metadata: {
            userId: userId,
            priceId: priceId,
          },
        },
      });

      return session;
    } catch (error: any) {
      throw new Error(`Erro ao criar a sessão de pagamento: ${error.message}`);
    }
  }
}
