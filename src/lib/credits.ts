import { Prisma } from "@/generated/prisma";
import { CreditPackage } from "@/lib/credit-packages";
import prisma from "@/lib/prisma";

export const INITIAL_ACCOUNT_CREDITS = 50;

export class InsufficientCreditsError extends Error {
  balance: number;
  required: number;

  constructor(balance: number, required: number) {
    super("Insufficient credits");
    this.name = "InsufficientCreditsError";
    this.balance = balance;
    this.required = required;
  }
}

export async function getOrCreateCreditAccount(userId: string) {
  return prisma.creditAccount.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      balance: INITIAL_ACCOUNT_CREDITS,
      totalGranted: INITIAL_ACCOUNT_CREDITS,
      transactions: {
        create: {
          amount: INITIAL_ACCOUNT_CREDITS,
          type: "GRANT",
          reason: "initial_account_allocation",
        },
      },
    },
  });
}

export async function spendCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: unknown,
) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Credit amount must be a positive integer");
  }

  const account = await getOrCreateCreditAccount(userId);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.creditAccount.updateMany({
      where: { userId, balance: { gte: amount } },
      data: {
        balance: { decrement: amount },
        totalSpent: { increment: amount },
      },
    });

    if (updated.count === 0) {
      const account = await tx.creditAccount.findUnique({
        where: { userId },
        select: { balance: true },
      });
      throw new InsufficientCreditsError(account?.balance ?? 0, amount);
    }

    await tx.creditTransaction.create({
      data: {
        creditAccountId: account.id,
        amount: -amount,
        type: "SPEND",
        reason,
        metadata: metadata === undefined ? undefined : (metadata as Prisma.InputJsonValue),
      },
    });

    return { ...account, balance: account.balance - amount };
  });
}

export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: unknown,
) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Credit amount must be a positive integer");
  }

  await getOrCreateCreditAccount(userId);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.creditAccount.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        totalSpent: { decrement: amount },
      },
      select: { id: true, balance: true },
    });

    await tx.creditTransaction.create({
      data: {
        creditAccountId: updated.id,
        amount,
        type: "REFUND",
        reason,
        metadata: metadata === undefined ? undefined : (metadata as Prisma.InputJsonValue),
      },
    });

    return updated;
  });
}

interface GrantPurchasedCreditsParams {
  userId: string;
  creditPackage: CreditPackage;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
  stripeEventId: string;
}

export async function grantPurchasedCredits({
  userId,
  creditPackage,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
  stripeEventId,
}: GrantPurchasedCreditsParams) {
  const account = await getOrCreateCreditAccount(userId);
  const paymentIntentId = stripePaymentIntentId ?? null;

  try {
    return await prisma.$transaction(async (tx) => {
      const purchase = await tx.creditPurchase.create({
        data: {
          creditAccountId: account.id,
          packageId: creditPackage.id,
          credits: creditPackage.credits,
          amountCents: creditPackage.amountCents,
          currency: creditPackage.currency,
          stripeCheckoutSessionId,
          stripePaymentIntentId: paymentIntentId,
          stripeEventId,
        },
      });

      const updated = await tx.creditAccount.update({
        where: { id: account.id },
        data: {
          balance: { increment: creditPackage.credits },
          totalGranted: { increment: creditPackage.credits },
        },
        select: { id: true, balance: true, totalGranted: true, totalSpent: true },
      });

      await tx.creditTransaction.create({
        data: {
          creditAccountId: account.id,
          amount: creditPackage.credits,
          type: "GRANT",
          reason: "credit_purchase",
          metadata: {
            creditPurchaseId: purchase.id,
            packageId: creditPackage.id,
            stripeCheckoutSessionId,
            stripePaymentIntentId: paymentIntentId,
            stripeEventId,
            amountCents: creditPackage.amountCents,
            currency: creditPackage.currency,
          },
        },
      });

      return { granted: true, account: updated, purchase };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { granted: false, duplicate: true };
    }

    throw error;
  }
}

export function creditsRequiredResponse(error: InsufficientCreditsError) {
  return Response.json(
    {
      success: false,
      error: "Insufficient credits",
      credits: {
        balance: error.balance,
        required: error.required,
      },
    },
    { status: 402 },
  );
}
