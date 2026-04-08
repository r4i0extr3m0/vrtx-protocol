// Supabase Edge Function: delete-user-account
//
// Objetivo:
// - Validar o usuario autenticado via Bearer token
// - Excluir o perfil associado (best effort)
// - Excluir o usuario do Supabase Auth de forma definitiva
//
// Secrets esperados:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

async function readJsonBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() ?? "";
  return token || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", message: "Metodo nao permitido para esta rota." }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      {
        error: "server_not_configured",
        message: "A funcao de exclusao de conta nao esta configurada corretamente no Supabase.",
      },
      500,
    );
  }

  const authHeader = req.headers.get("authorization");
  const accessToken = extractBearerToken(authHeader);
  if (!accessToken) {
    return jsonResponse(
      {
        error: "missing_authorization",
        message: "A requisicao nao enviou a autorizacao do usuario autenticado.",
      },
      401,
    );
  }

  const payload = await readJsonBody(req);
  const reason = typeof payload?.reason === "string" ? payload.reason.trim().slice(0, 1000) : "";

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(accessToken);

  if (userError || !user) {
    return jsonResponse({ error: "unauthorized", message: userError?.message ?? "invalid_user" }, 401);
  }

  if (reason) {
    console.info("[delete-user-account.reason]", JSON.stringify({ userId: user.id, reason }));
  }

  const profileDelete = await adminClient.from("profiles").delete().eq("id", user.id);
  if (profileDelete.error) {
    console.warn("[delete-user-account.profile]", profileDelete.error.message);
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return jsonResponse({ error: "delete_user_failed", message: deleteError.message }, 500);
  }

  return jsonResponse({ ok: true, message: "Sua conta foi excluida com sucesso." });
});
