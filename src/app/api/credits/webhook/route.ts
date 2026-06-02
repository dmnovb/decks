import Stripe from "stripe";
import { getCreditPackage } from "@/lib/credit-packages";
import { grantPurchasedCredits } from "@/lib/credits";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

function getPaymentIntentId(paymentIntent: Stripe.Checkout.Session["payment_intent"]) {
  if (!paymentIntent) return null;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

function getSessionUserId(session: Stripe.Checkout.Session) {
  return session.client_reference_id;
}

function acknowledgedWebhookIssue(error: string, sessionId: string) {
  console.error(`Ignoring Stripe checkout session ${sessionId}: ${error}`);
  return Response.json({ success: true, received: true, ignored: true, error });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ success: false, error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return Response.json({ success: false, error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ success: true, received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return Response.json({ success: true, received: true });
  }

  const userId = getSessionUserId(session);
  const packageId = session.metadata?.packageId;
  const creditPackage = packageId ? getCreditPackage(packageId) : undefined;

  if (!userId || !creditPackage) {
    return acknowledgedWebhookIssue("Invalid checkout metadata", session.id);
  }

  if (
    session.amount_total !== creditPackage.amountCents ||
    session.currency !== creditPackage.currency
  ) {
    return acknowledgedWebhookIssue("Invalid checkout amount", session.id);
  }

  try {
    const result = await grantPurchasedCredits({
      userId,
      creditPackage,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: getPaymentIntentId(session.payment_intent),
      stripeEventId: event.id,
    });

    return Response.json({
      success: true,
      received: true,
      granted: result.granted,
      duplicate: "duplicate" in result ? result.duplicate : false,
    });
  } catch (error) {
    console.error("Grant purchased credits error:", error);
    return Response.json({ success: false, error: "Failed to grant credits" }, { status: 500 });
  }
}
