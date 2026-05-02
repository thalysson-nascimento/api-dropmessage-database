import { Decimal } from "@prisma/client/runtime";
import clientStripe from "../../../../config/stripe.config";
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
} from "../../../../enums/user-data.enum";
import { GetSessionStripePaymentRepository } from "./getSessionStripePaymentRepository";

export class GetSessionStripePaymentUseCase {
  private repository: GetSessionStripePaymentRepository;

  constructor() {
    this.repository = new GetSessionStripePaymentRepository();
  }

  async execute(userId: string) {
    const userCurrencyData = await this.repository.getUserCurrency(userId);

    const currency = this.resolveCurrency(userCurrencyData?.currency);

    const { products, prices } = await this.getStripeData();

    const filteredPrices = this.filterPricesByCurrency(prices, currency);

    const productsWithPrices = this.mapProductsWithPrices(
      products,
      filteredPrices,
    );

    return this.sortProducts(productsWithPrices);
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
    // return "BRL";
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
    const validProductIds = new Set(prices.map((p) => p.product));

    return products
      .filter(
        (product) =>
          product.active &&
          product.metadata?.type === "datingmatch" &&
          validProductIds.has(product.id),
      )
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
      .filter((price) => price.product === productId)
      .map((price) => ({
        priceId: price.id,
        currency: price.currency,
        unitAmount:
          price.unit_amount !== null
            ? new Decimal(price.unit_amount / 100)
            : null,
        interval: price.recurring?.interval || null,
        intervalCount: price.recurring?.interval_count || null,
        logoPath:
          this.getPlanConfig(
            price.recurring?.interval,
            price.recurring?.interval_count,
          )?.logo ?? null,
        backgroundColor:
          this.getPlanConfig(
            price.recurring?.interval,
            price.recurring?.interval_count,
          )?.color ?? null,
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
  // 🔹 Plan Config (🔥 sem if)
  // =========================
  private getPlanConfig(interval?: string | null, intervalCount?: number) {
    const key =
      interval === "month" ? `${interval}_${intervalCount}` : interval;

    const PLAN_CONFIG: Record<
      string,
      {
        color: { colorTop: string; colorBottom: string };
        logo: string;
      }
    > = {
      week: {
        color: {
          colorTop: "#00B894",
          colorBottom: "#03836A",
        },
        logo: "https://res.cloudinary.com/dlereelmj/image/upload/v1737918313/public-image/j4f8psefs98dykutfdtr.svg",
      },
      month_1: {
        color: {
          colorTop: "#DCC156",
          colorBottom: "#856E14",
        },
        logo: "https://res.cloudinary.com/dlereelmj/image/upload/v1737918639/public-image/jcvi9gsq1m6jbtiq3sme.svg",
      },
      month_6: {
        color: {
          colorTop: "#996D6D",
          colorBottom: "#55236B",
        },
        logo: "https://res.cloudinary.com/dlereelmj/image/upload/v1737918713/public-image/llprqodeb9puhi3bm1tw.svg",
      },
    };

    return key ? PLAN_CONFIG[key] : undefined;
  }
}
