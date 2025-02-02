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

    const targetCurrency = userCurrency.currency.toUpperCase();

    const listProductStripe = await clientStripe.products.list();

    // Buscar todos os preços ativos primeiro
    const pricesList = await clientStripe.prices.list({
      active: true, // Apenas preços ativos
    });

    // Filtrar os preços que correspondem à moeda desejada
    const filteredPrices = pricesList.data.filter(
      (price) => price.currency.toUpperCase() === targetCurrency
    );

    // Criar um mapa de produtos que possuem preços na moeda correta
    const validProductIds = new Set(
      filteredPrices.map((price) => price.product)
    );

    // Filtrar os produtos ativos que têm pelo menos um preço válido
    const activeProducts = listProductStripe.data.filter(
      (product) =>
        product.active &&
        product.metadata.key !== "plan_gold_free_trial" &&
        validProductIds.has(product.id)
    );

    // Mapear os produtos adicionando os preços correspondentes
    const productsWithPrices = activeProducts.map((product) => {
      const productPrices = filteredPrices
        .filter((price) => price.product === product.id)
        .map((price) => ({
          priceId: price.id,
          currency: price.currency,
          unitAmount:
            price.unit_amount !== null
              ? new Decimal(price.unit_amount / 100)
              : null,
          interval: price.recurring?.interval || null,
          intervalCount: price.recurring?.interval_count || null,
          logoPath: this.logoPath(
            price.recurring?.interval,
            price.recurring?.interval_count
          ),
          backgroundColor: this.backgroundColor(
            price.recurring?.interval,
            price.recurring?.interval_count
          ),
        }))
        .sort(
          (a, b) =>
            (a.unitAmount?.toNumber() ?? 0) - (b.unitAmount?.toNumber() ?? 0)
        ); // Ordenar os preços dentro do produto

      return {
        ...product,
        prices: productPrices,
      };
    });

    // Ordenar os produtos com base no menor preço disponível
    return productsWithPrices.sort((a, b) => {
      const minPriceA =
        a.prices.length > 0
          ? a.prices[0].unitAmount?.toNumber() ?? Infinity
          : Infinity;
      const minPriceB =
        b.prices.length > 0
          ? b.prices[0].unitAmount?.toNumber() ?? Infinity
          : Infinity;
      return minPriceA - minPriceB;
    });
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
      return "https://res.cloudinary.com/dlereelmj/image/upload/v1737918313/public-image/j4f8psefs98dykutfdtr.svg";
    } else if (interval === "month" && intervalCount === 1) {
      return "https://res.cloudinary.com/dlereelmj/image/upload/v1737918639/public-image/jcvi9gsq1m6jbtiq3sme.svg";
    } else if (interval === "month" && intervalCount === 6) {
      return "https://res.cloudinary.com/dlereelmj/image/upload/v1737918713/public-image/llprqodeb9puhi3bm1tw.svg";
    } else {
      return null;
    }
  }
}
