import { NextRequest } from "next/server";
import { z } from "zod";
import { getCreditPackage, isCreditPackageId } from "@/lib/credit-packages";
import { verifyToken } from "@/lib/auth/helpers";
import { validateJsonBody } from "@/lib/api/validation";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  packageId: z.string().refine(isCreditPackageId, "Unknown credit package"),
});

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

function getCheckoutOrigin(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return Response.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, checkoutSchema, {
      errorKey: "error",
      includeSuccess: true,
    });
    if (!body.success) return body.response;

    const creditPackage = getCreditPackage(body.data.packageId);
    if (!creditPackage) {
      return Response.json({ success: false, error: "Unknown credit package" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const origin = getCheckoutOrigin(request);
    const metadata = {
      userId,
      packageId: creditPackage.id,
      credits: String(creditPackage.credits),
    };

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: userId,
      customer_email: user.email,
      success_url: `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      metadata,
      payment_intent_data: { metadata },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: creditPackage.currency,
            unit_amount: creditPackage.amountCents,
            product_data: {
              name: `${creditPackage.credits} credits`,
              description: `${creditPackage.name} credit package`,
              metadata,
            },
          },
        },
      ],
    });

    if (!session.url) {
      return Response.json(
        { success: false, error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return Response.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Create credit checkout error:", error);
    return Response.json(
      { success: false, error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
