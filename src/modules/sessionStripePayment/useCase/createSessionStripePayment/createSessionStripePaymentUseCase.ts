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

  async execute(priceId: string, countryCode: string, userId: string) {
    const upperCountryCode = countryCode.toUpperCase();
    const currency = COUNTRY_TO_CURRENCY.hasOwnProperty(upperCountryCode)
      ? COUNTRY_TO_CURRENCY[
          upperCountryCode as keyof typeof COUNTRY_TO_CURRENCY
        ]
      : "usd";

    try {
      const session = await clientStripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.BASE_URL}/successsuccess`,
        cancel_url: `${process.env.BASE_URL}/cancel`,
        currency,
        metadata: {
          userId,
          priceId,
        },
      });

      // await clientStripe.webhookEndpoints.create({
      //   url: `${process.env.BASE_URL}/stripe/webhook`,
      //   enabled_events: [
      //     "payment_intent.payment_failed",
      //     "payment_intent.succeeded",
      //   ],
      //   metadata: {
      //     userId,
      //     priceId,
      //   },
      // });

      return session;
    } catch (error: any) {
      throw new Error(`Erro ao criar a sessão de pagamento: ${error.message}`);
    }
  }
}
