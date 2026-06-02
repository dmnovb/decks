import Stripe from "stripe";

export const STRIPE_API_VERSION = "2026-05-27.dahlia";

let stripe: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripe ??= new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
  return stripe;
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return webhookSecret;
}
