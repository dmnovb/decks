# Credit purchase manual verification

## Required environment

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` for deployed checkout redirects; local development falls back to the request origin.

## Checkout creation

1. Sign in.
2. Open `/pricing`.
3. Click a package purchase button.
4. Confirm the app redirects to a Stripe Checkout Session for the selected package.
5. Confirm unauthenticated requests to `POST /api/credits/checkout` return `401`.
6. Confirm unknown package IDs return `400`.

## Webhook verification

1. Use Stripe CLI or a Dashboard webhook endpoint pointed at `/api/credits/webhook`.
2. Complete a Checkout payment.
3. Confirm the webhook request returns `200`.
4. Confirm `CreditAccount.balance` and `CreditAccount.totalGranted` increase by the purchased credits.
5. Confirm a `CreditTransaction` row exists with `type = GRANT` and `reason = credit_purchase`.
6. Confirm a `CreditPurchase` row records the Stripe checkout session, payment intent, and event IDs.

## Idempotency

1. Redeliver the same `checkout.session.completed` webhook event from Stripe.
2. Confirm the webhook still returns `200`.
3. Confirm no second `CreditPurchase` row is created.
4. Confirm no second `CreditTransaction` row is created.
5. Confirm the credit balance does not increase a second time.

## Failed or canceled payments

1. Cancel Checkout and return to `/pricing`.
2. Confirm no credits are granted.
3. Send or inspect non-`paid` Checkout Session events.
4. Confirm the webhook acknowledges the event without granting credits.
