// Supabase Edge Function: revenuecat-webhook
//
// Objetivo:
// - Receber webhooks do RevenueCat
// - Atualizar `profiles.is_premium`, `premium_until`, `premium_source`, `revenuecat_app_user_id`
//
// Setup (alto nível):
// 1) Defina secrets na função:
//    - SUPABASE_URL
//    - SUPABASE_SERVICE_ROLE_KEY
//    - REVENUECAT_WEBHOOK_SECRET (use como Bearer token no header Authorization)
// 2) Configure o webhook no RevenueCat para apontar para:
//    https://<project-ref>.functions.supabase.co/revenuecat-webhook
//
// Observação:
// O payload de webhook pode variar conforme o tipo de evento/versão. Aqui fazemos parsing defensivo.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type Json = Record<string, unknown>;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function extractUserId(payload: Json): string | null {
  // RevenueCat costuma enviar app_user_id em diferentes níveis
  return (
    asString(payload.app_user_id) ??
    asString((payload.event as Json | undefined)?.app_user_id) ??
    asString((payload.subscriber as Json | undefined)?.app_user_id) ??
    null
  );
}

function extractExpirationIso(payload: Json): string | null {
  // Alguns payloads têm expiration_at_ms (epoch millis)
  const ms =
    asNumber(payload.expiration_at_ms) ??
    asNumber((payload.event as Json | undefined)?.expiration_at_ms) ??
    asNumber((payload.subscriber as Json | undefined)?.expiration_at_ms) ??
    null;

  if (ms) {
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const iso =
    asString(payload.expiration_at) ??
    asString((payload.event as Json | undefined)?.expiration_at) ??
    asString((payload.subscriber as Json | undefined)?.expiration_at) ??
    null;

  return iso;
}

function isPremiumFromEvent(payload: Json): boolean {
  // Fallback simples: considera premium quando o evento indica purchase/renewal e não expirou.
  const eventType =
    asString(payload.type) ?? asString((payload.event as Json | undefined)?.type) ?? "unknown";

  const expIso = extractExpirationIso(payload);
  if (expIso) {
    const exp = new Date(expIso);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() <= Date.now()) return false;
  }

  const positive = ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE", "NON_RENEWING_PURCHASE"];
  const negative = ["CANCELLATION", "EXPIRATION", "BILLING_ISSUE", "REFUND"];

  if (negative.includes(eventType)) return false;
  if (positive.includes(eventType)) return true;

  // Se não souber, não concede premium automaticamente
  return false;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (secret) {
    const token = getBearerToken(req.headers.get("authorization"));
    if (token !== secret) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "server_not_configured" }, 500);
  }

  let payload: Json;
  try {
    payload = (await req.json()) as Json;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const userId = extractUserId(payload);
  if (!userId) {
    return jsonResponse({ error: "missing_user_id" }, 400);
  }

  const isPremium = isPremiumFromEvent(payload);
  const premiumUntil = extractExpirationIso(payload);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await supabase
    .from("profiles")
    .update({
      is_premium: isPremium,
      premium_until: premiumUntil,
      premium_source: "revenuecat",
      revenuecat_app_user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return jsonResponse({ error: "supabase_update_failed", message: error.message }, 500);
  }

  return jsonResponse({ ok: true });
});

