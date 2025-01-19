import Stripe from "stripe";
import clientStripe from "../../../../config/stripe.config";
import { GetSessionStripePaymentRepository } from "./getSessionStripePaymentRepository";

const COUNTRY_TO_CURRENCY = ["BRL", "USD", "EUR"];

export class GetSessionStripePaymentUseCase {
  private repository: GetSessionStripePaymentRepository;

  constructor() {
    this.repository = new GetSessionStripePaymentRepository();
  }

  async execute(userId: string) {
    const userCurrency = await this.repository.getUserCurrency(userId);

    if (!userCurrency || !COUNTRY_TO_CURRENCY.includes(userCurrency.currency)) {
      throw new Error(
        `Currency not supported or invalid: ${userCurrency?.currency}`
      );
    }

    const listProductStripe = await clientStripe.prices.list({
      expand: ["data.product"],
    });

    const listProductActiveTrue = listProductStripe.data.filter(
      (item: Stripe.Price) =>
        item.currency === userCurrency.currency.toLocaleLowerCase() &&
        // item.currency === "eur" &&
        (item.product as Stripe.Product).active === true
    );

    return listProductActiveTrue;
  }
}
