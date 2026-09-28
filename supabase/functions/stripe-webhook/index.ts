import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getPlanFromPriceId, getStripe, jsonResponse, type PaidPlan } from "../_shared/stripe.ts";

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} nao configurada.`);
  return value;
}

function isoFromUnix(value: number | null | undefined): string | null {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function normalizeStatus(status: string): string {
  if (status === "active" || status === "trialing" || status === "past_due" || status === "canceled" || status === "incomplete") {
    return status;
  }
  return status === "unpaid" ? "expired" : "expired";
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  try {
    const webhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");
    const signature = req.headers.get("stripe-signature");
    if (!signature) return jsonResponse({ error: "missing_signature" }, 400);

    const rawBody = await req.text();
    const stripe = getStripe();
    const event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { error: eventError } = await admin.from("billing_events").insert({
      provider: "stripe",
      provider_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });
    if (eventError?.code === "23505") return jsonResponse({ ok: true, duplicate: true });
    if (eventError) return jsonResponse({ error: "event_record_failed" }, 500);

    const object = event.data.object as any;
    let subscription: any = null;
    let coachId = object?.metadata?.coach_id ?? object?.client_reference_id ?? null;

    if (event.type === "checkout.session.completed") {
      if (object.subscription) subscription = await stripe.subscriptions.retrieve(String(object.subscription));
      coachId = coachId ?? subscription?.metadata?.coach_id;
    } else if (event.type.startsWith("customer.subscription.")) {
      subscription = object;
      coachId = coachId ?? subscription?.metadata?.coach_id;
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      if (object.subscription) subscription = await stripe.subscriptions.retrieve(String(object.subscription));
    } else if (event.type === "charge.refunded") {
      return jsonResponse({ ok: true, ignored: true });
    }

    if (!subscription) return jsonResponse({ ok: true, recorded: true });

    const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
    const plan = getPlanFromPriceId(priceId) as PaidPlan | null;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    if (!coachId && customerId) {
      const { data: existing } = await admin
        .from("coach_subscriptions")
        .select("coach_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      coachId = existing?.coach_id ?? null;
    }
    if (!coachId || !plan) return jsonResponse({ error: "subscription_identity_unresolved" }, 422);

    const status = normalizeStatus(subscription.status);
    const activePlan = status === "active" || status === "trialing" ? plan : "free";
    const { error: subscriptionError } = await admin.from("coach_subscriptions").upsert({
      coach_id: coachId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan: activePlan,
      status,
      current_period_end: isoFromUnix(subscription.current_period_end),
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    }, { onConflict: "coach_id" });
    if (subscriptionError) return jsonResponse({ error: "subscription_update_failed" }, 500);

    const { error: profileError } = await admin
      .from("profiles")
      .update({ coach_plan: activePlan, updated_at: new Date().toISOString() })
      .eq("id", coachId)
      .eq("role", "coach");
    if (profileError) return jsonResponse({ error: "profile_update_failed" }, 500);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("[stripe-webhook]", error);
    return jsonResponse({ error: "webhook_failed" }, 400);
  }
});
