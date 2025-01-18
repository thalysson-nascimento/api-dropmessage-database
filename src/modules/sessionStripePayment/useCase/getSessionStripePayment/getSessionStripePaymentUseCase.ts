import Stripe from "stripe";
import clientStripe from "../../../../config/stripe.config";
import { GetSessionStripePaymentRepository } from "./getSessionStripePaymentRepository";

const COUNTRY_TO_CURRENCY = {
  BR: "brl",
  US: "usd",
  EU: "eur",
};

export class GetSessionStripePaymentUseCase {
  private repository: GetSessionStripePaymentRepository;

  constructor() {
    this.repository = new GetSessionStripePaymentRepository();
  }

  async execute() {
    const currency = "eur";

    const listProductStripe = await clientStripe.prices.list({
      expand: ["data.product"],
    });

    const listProductActiveTrue = listProductStripe.data
      .filter(
        (item: Stripe.Price) =>
          item.lookup_key === "teste_plan_eur_02" &&
          item.currency === currency &&
          (item.product as Stripe.Product).active === true
      )
      .map((item: Stripe.Price, index: number) => {
        const colors = [
          { color_top: "#FF5733", color_bottom: "#FFC300" },
          { color_top: "#33FF57", color_bottom: "#33FFC3" },
          { color_top: "#3357FF", color_bottom: "#C333FF" },
        ];

        return {
          ...item,
          background: colors[index % colors.length],
        };
      });

    return listProductActiveTrue;
  }
}
