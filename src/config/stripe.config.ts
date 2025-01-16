import Stripe from "stripe";

const clientStripe = new Stripe(String(process.env.STRIPE_SECRET_KEY), {
  apiVersion: "2024-12-18.acacia",
});

export default clientStripe;
