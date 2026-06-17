export const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    credits: 60,
    amountCents: 299,
    currency: "usd",
    perCredit: "5.0¢",
    featured: false,
    note: "Light use",
  },
  {
    id: "plus",
    name: "Plus",
    credits: 180,
    amountCents: 699,
    currency: "usd",
    perCredit: "3.9¢",
    featured: true,
    note: "Regular use",
  },
  {
    id: "max",
    name: "Max",
    credits: 420,
    amountCents: 1499,
    currency: "usd",
    perCredit: "3.6¢",
    featured: false,
    note: "Best value",
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
