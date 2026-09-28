import Stripe from "npm:stripe@18.5.0";

export const PLAN_PRICES = {
  basic: "price_1UHTGsP9zK2uwC0saFYM7iRR",
  plus: "price_1UHTH6P9zK2uwC0slCyanYdq",
  premier: "price_1UHTHNP9zK2uwC0s2UpYPYPb",
} as const;

export type PaidPlan = keyof typeof PLAN_PRICES;

export function getStripe(): Stripe {
  const secret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY nao configurada.");
  }

  return new Stripe(secret, {
    apiVersion: "2025-06-30.basil",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function getPlanFromPriceId(priceId: string | null | undefined): PaidPlan | null {
  if (!priceId) return null;
  const entry = Object.entries(PLAN_PRICES).find(([, value]) => value === priceId);
  return (entry?.[0] as PaidPlan | undefined) ?? null;
}

export function getBearerToken(value: string | null): string | null {
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}
