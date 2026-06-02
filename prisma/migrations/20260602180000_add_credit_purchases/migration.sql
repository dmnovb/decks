-- Records verified Stripe checkout completions before granting credits.
-- Unique Stripe identifiers make webhook handling idempotent.
CREATE TABLE "public"."CreditPurchase" (
    "id" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeEventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreditPurchase_stripeCheckoutSessionId_key" ON "public"."CreditPurchase"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "CreditPurchase_stripePaymentIntentId_key" ON "public"."CreditPurchase"("stripePaymentIntentId");
CREATE UNIQUE INDEX "CreditPurchase_stripeEventId_key" ON "public"."CreditPurchase"("stripeEventId");
CREATE INDEX "CreditPurchase_creditAccountId_createdAt_idx" ON "public"."CreditPurchase"("creditAccountId", "createdAt");

ALTER TABLE "public"."CreditPurchase" ADD CONSTRAINT "CreditPurchase_creditAccountId_fkey"
FOREIGN KEY ("creditAccountId") REFERENCES "public"."CreditAccount"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
