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

  async execute(countryCode: string) {
    const upperCountryCode = countryCode.toUpperCase();
    const currency = COUNTRY_TO_CURRENCY.hasOwnProperty(upperCountryCode)
      ? COUNTRY_TO_CURRENCY[
          upperCountryCode as keyof typeof COUNTRY_TO_CURRENCY
        ]
      : "usd";

    const prices = await clientStripe.prices.list({
      expand: ["data.product"],
      active: true,
    });

    const filteredPrices = prices.data.map((price) => {
      const currencyOption = price.currency_options?.[currency];
      return {
        priceId: price.id,
        product: price.product,
        currency,
        unitAmount:
          currencyOption?.unit_amount_decimal || price.unit_amount_decimal, // Valor da moeda desejada ou padrão
        billingScheme: price.billing_scheme,
        nickname: price.nickname,
      };
    });

    return filteredPrices;
  }
}
