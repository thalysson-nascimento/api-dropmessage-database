import createHttpError from "http-errors";
import Stripe from "stripe";
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

    const userCustomIdStripe = await this.repository.userStripeCustomerrId(
      userId
    );

    const subscription = await clientStripe.subscriptions.create({
      customer: userCustomIdStripe?.customerId as string,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete", // Define o comportamento do pagamento
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        userId: userId,
        priceId: priceId,
      },
    });

    if (
      subscription.latest_invoice &&
      typeof subscription.latest_invoice !== "string"
    ) {
      const invoice = subscription.latest_invoice as Stripe.Invoice;

      if (invoice.payment_intent) {
        const paymentIntent =
          typeof invoice.payment_intent === "string"
            ? await clientStripe.paymentIntents.retrieve(invoice.payment_intent)
            : invoice.payment_intent;

        if (!paymentIntent.client_secret) {
          throw new Error("Erro ao gerar o client_secret do PaymentIntent.");
        }

        return paymentIntent.client_secret; // Retorna o client_secret corretamente
      }
    }
  }
}
