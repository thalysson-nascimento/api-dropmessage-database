import { Decimal } from "@prisma/client/runtime";
import clientStripe from "../../../../config/stripe.config";
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
} from "../../../../enums/user-data.enum";
import { SubscriptionAIRepository } from "./subscriptionAIRepository";

type TierType = "basic" | "pro" | "premium";

export class SubscriptionAIUseCase {
  private repository: SubscriptionAIRepository;

  constructor() {
    this.repository = new SubscriptionAIRepository();
  }

  async execute(userId: string) {
    const userCurrencyData = await this.repository.getUserCurrency(userId);

    const currency = this.resolveCurrency(userCurrencyData?.currency);
    console.log("Resolved Currency:", currency);

    const { products, prices } = await this.getStripeData();

    const filteredPrices = this.filterPricesByCurrency(prices, currency);

    const productsWithPrices = this.mapProductsWithPrices(
      products,
      filteredPrices,
    );

    const sortedProducts = this.sortProducts(productsWithPrices).reverse();

    return this.groupByTier(sortedProducts);
  }

  // =========================
  // 🔹 Currency
  // =========================
  private resolveCurrency(userCurrency?: string): string {
    if (!userCurrency) return DEFAULT_CURRENCY;

    const currency = userCurrency.toUpperCase();

    return SUPPORTED_CURRENCIES.includes(currency)
      ? currency
      : DEFAULT_CURRENCY;
    // return "EUR";
  }

  // =========================
  // 🔹 Stripe Data
  // =========================
  private async getStripeData() {
    const [products, prices] = await Promise.all([
      clientStripe.products.list({ limit: 100 }),
      clientStripe.prices.list({ active: true, limit: 100 }),
    ]);

    return { products: products.data, prices: prices.data };
  }

  // =========================
  // 🔹 Filters
  // =========================
  private filterPricesByCurrency(prices: any[], currency: string) {
    return prices.filter((price) => price.currency.toUpperCase() === currency);
  }

  // =========================
  // 🔹 Mapping Products
  // =========================
  private mapProductsWithPrices(products: any[], prices: any[]) {
    const validProductIds = new Set(
      prices.map((p) =>
        typeof p.product === "string" ? p.product : p.product.id,
      ),
    );

    return products
      .filter((product) => {
        const hasValidPrice = validProductIds.has(product.id);

        const isCorrectType = product.metadata?.type === "PLAN_DATING_AI";

        return product.active && hasValidPrice && isCorrectType;
      })
      .map((product) => ({
        ...product,
        prices: this.mapPrices(product.id, prices),
      }));
  }

  // =========================
  // 🔹 Mapping Prices
  // =========================
  private mapPrices(productId: string, prices: any[]) {
    return prices
      .filter((price) => {
        const priceProductId =
          typeof price.product === "string" ? price.product : price.product.id;

        return priceProductId === productId;
      })
      .map((price) => ({
        priceId: price.id,
        currency: price.currency,
        unitAmount:
          price.unit_amount !== null
            ? new Decimal(price.unit_amount / 100)
            : null,
        interval: price.recurring?.interval || null,
        intervalCount: price.recurring?.interval_count || null,
      }))
      .sort(
        (a, b) =>
          (a.unitAmount?.toNumber() ?? 0) - (b.unitAmount?.toNumber() ?? 0),
      );
  }

  // =========================
  // 🔹 Sorting
  // =========================
  private sortProducts(products: any[]) {
    return products.sort((a, b) => {
      const minA = a.prices[0]?.unitAmount?.toNumber() ?? Infinity;
      const minB = b.prices[0]?.unitAmount?.toNumber() ?? Infinity;
      return minA - minB;
    });
  }

  // =========================
  // 🔥 Group by Tier
  // =========================
  private groupByTier(products: any[]) {
    const grouped: Record<TierType, any[]> = {
      basic: [],
      pro: [],
      premium: [],
    };

    for (const product of products) {
      const tierRaw = product.metadata?.tier;

      if (!tierRaw) continue;

      const tier = tierRaw.toLowerCase().trim() as TierType;

      if (grouped[tier]) {
        grouped[tier].push(product);
      }
    }

    return grouped;
  }
}
