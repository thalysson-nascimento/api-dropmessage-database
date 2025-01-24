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

    const price = await clientStripe.prices.retrieve(priceId);

    if (!price) {
      throw createHttpError(400, "Produto não encontrado no Stripe");
    }

    if (!price.unit_amount || !price.currency) {
      throw createHttpError(400, "Preço ou moeda inválidos no Stripe");
    }

    const paymentIntent = await clientStripe.paymentIntents.create({
      amount: price.unit_amount as number,
      currency: price.currency,
      payment_method_types: ["card"],
      metadata: {
        userId: userId,
        priceId: priceId,
      },
    });

    return paymentIntent;
  }
}
