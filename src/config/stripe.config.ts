import Stripe from "stripe";
import { env } from "../env";

const clientStripe = new Stripe(String(env.STRIPE_SECRET_KEY), {
  apiVersion: "2024-12-18.acacia",
});

export default clientStripe;
