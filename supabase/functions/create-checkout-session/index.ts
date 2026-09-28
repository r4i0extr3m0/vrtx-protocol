import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getBearerToken, getStripe, jsonResponse, PLAN_PRICES, type PaidPlan } from "../_shared/stripe.ts";

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} nao configurada.`);
  return value;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return jsonResponse({ ok: true });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const anonKey = getEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const token = getBearerToken(req.headers.get("authorization"));
    if (!token) return jsonResponse({ error: "missing_authorization" }, 401);

    const userClient = createClient(supabaseUrl, anonKey);
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) return jsonResponse({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, name")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError) return jsonResponse({ error: "profile_lookup_failed" }, 500);
    if (profile?.role !== "coach") return jsonResponse({ error: "coach_account_required" }, 403);

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan as PaidPlan;
    if (!Object.prototype.hasOwnProperty.call(PLAN_PRICES, plan)) {
      return jsonResponse({ error: "invalid_plan", allowed: Object.keys(PLAN_PRICES) }, 400);
    }

    const stripe = getStripe();
    const { data: existing } = await admin
      .from("coach_subscriptions")
      .select("stripe_customer_id, status")
      .eq("coach_id", authData.user.id)
      .maybeSingle();

    const customer = existing?.stripe_customer_id
      ? existing.stripe_customer_id
      : await stripe.customers.create({
          email: authData.user.email ?? undefined,
          name: profile?.name ?? undefined,
          metadata: { coach_id: authData.user.id },
        }).then((created) => created.id);

    const successUrl = Deno.env.get("STRIPE_CHECKOUT_SUCCESS_URL") ?? "https://vrtxprotocol.com/billing/success";
    const cancelUrl = Deno.env.get("STRIPE_CHECKOUT_CANCEL_URL") ?? "https://vrtxprotocol.com/billing/cancel";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price: PLAN_PRICES[plan], quantity: 1 }],
      client_reference_id: authData.user.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { coach_id: authData.user.id, plan },
      subscription_data: {
        metadata: { coach_id: authData.user.id, plan },
      },
    });

    await admin.from("coach_subscriptions").upsert({
      coach_id: authData.user.id,
      stripe_customer_id: customer,
      updated_at: new Date().toISOString(),
    }, { onConflict: "coach_id" });

    return jsonResponse({ session_id: session.id, url: session.url });
  } catch (error) {
    console.error("[create-checkout-session]", error);
    return jsonResponse({ error: "checkout_creation_failed" }, 500);
  }
});
