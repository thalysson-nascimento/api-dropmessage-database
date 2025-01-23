import { Decimal } from "@prisma/client/runtime";
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

    // Certificar-se de que a moeda está em letras minúsculas
    const targetCurrency = userCurrency.currency.toUpperCase();

    const listProductStripe = await clientStripe.products.list();

    // Filtrar apenas produtos ativos
    const activeProducts = listProductStripe.data.filter(
      (product) => product.active
    );

    // Mapear os produtos e adicionar informações adicionais (preços)
    const productsWithPrices = await Promise.all(
      activeProducts.map(async (product) => {
        const prices = await clientStripe.prices.list({
          product: product.id,
          active: true, // Filtrar apenas preços ativos
        });

        // Certificar-se de que currency é comparado corretamente
        const filteredPrices = prices.data.filter(
          (price) => price.currency.toUpperCase() === targetCurrency
        );

        return {
          ...product,
          prices: filteredPrices.map((price) => ({
            priceId: price.id,
            currency: price.currency,
            unitAmount:
              price.unit_amount !== null
                ? new Decimal(price.unit_amount / 100)
                : null,
            interval: price.recurring?.interval || null, // Caso seja um preço recorrente
            intervalCount: price.recurring?.interval_count || null,
            logoPath: this.logoPath(
              price.recurring?.interval,
              price.recurring?.interval_count
            ),
            backgroundColor: this.backgroundColor(
              price.recurring?.interval,
              price.recurring?.interval_count
            ),
          })),
        };
      })
    );

    // Filtrar produtos que possuem pelo menos um preço na moeda do usuário
    return productsWithPrices.filter((product) => product.prices.length > 0);
  }

  private backgroundColor(interval?: string | null, intervalCount?: number) {
    if (interval === "week") {
      return {
        colorTop: "#00B894",
        colorBottom: "#03836A",
      };
    } else if (interval === "month" && intervalCount === 1) {
      return {
        colorTop: "#DCC156",
        colorBottom: "#856E14",
      };
    } else if (interval === "month" && intervalCount === 6) {
      return {
        colorTop: "#996D6D",
        colorBottom: "#55236B",
      };
    }
  }

  private logoPath(interval?: string | null, intervalCount?: number) {
    if (interval === "week") {
      return "https://res.cloudinary.com/dlereelmj/image/upload/v1737496410/logo-green_pwnznf.png";
    } else if (interval === "month" && intervalCount === 1) {
      return "https://res.cloudinary.com/dlereelmj/image/upload/v1737496410/logo-yeloow_zgqcbu.png";
    } else if (interval === "month" && intervalCount === 6) {
      return "https://res.cloudinary.com/dlereelmj/image/upload/v1737496410/logo-purple_rueoi0.png";
    } else {
      return null;
    }
  }
}
