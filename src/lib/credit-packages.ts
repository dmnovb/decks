export const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    credits: 100,
    amountCents: 100,
    currency: "usd",
    perCredit: "1.0¢",
    featured: false,
    note: "Try it out",
  },
  {
    id: "plus",
    name: "Plus",
    credits: 500,
    amountCents: 400,
    currency: "usd",
    perCredit: "0.8¢",
    featured: true,
    note: "Best value",
  },
  {
    id: "max",
    name: "Max",
    credits: 2000,
    amountCents: 1200,
    currency: "usd",
    perCredit: "0.6¢",
    featured: false,
    note: "Power users",
  },
] as const;

export type CreditPackage = (typeof CREDIT_PACKAGES)[number];
export type CreditPackageId = CreditPackage["id"];

export function getCreditPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((creditPackage) => creditPackage.id === packageId);
}

export function isCreditPackageId(packageId: string): packageId is CreditPackageId {
  return getCreditPackage(packageId) !== undefined;
}

export function formatCreditPackagePrice(creditPackage: CreditPackage) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: creditPackage.currency,
  }).format(creditPackage.amountCents / 100);
}
