-- CreateEnum
CREATE TYPE "public"."CreditTxnType" AS ENUM ('GRANT', 'SPEND', 'REFUND');

-- CreateTable
CREATE TABLE "public"."CreditAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 50,
    "totalGranted" INTEGER NOT NULL DEFAULT 50,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditTransaction" (
    "id" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "public"."CreditTxnType" NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditAccount_userId_key" ON "public"."CreditAccount"("userId");

-- CreateIndex
CREATE INDEX "CreditAccount_userId_idx" ON "public"."CreditAccount"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_creditAccountId_createdAt_idx" ON "public"."CreditTransaction"("creditAccountId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."CreditAccount" ADD CONSTRAINT "CreditAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditTransaction" ADD CONSTRAINT "CreditTransaction_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "public"."CreditAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill existing users with the initial allocation.
INSERT INTO "public"."CreditAccount" ("id", "userId", "balance", "totalGranted", "totalSpent", "updatedAt")
SELECT 'credit_account_' || "id", "id", 50, 50, 0, CURRENT_TIMESTAMP
FROM "public"."User"
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO "public"."CreditTransaction" ("id", "creditAccountId", "amount", "type", "reason")
SELECT 'credit_txn_initial_' || "userId", "id", 50, 'GRANT', 'initial_account_allocation'
FROM "public"."CreditAccount"
WHERE "totalGranted" = 50 AND "totalSpent" = 0;
