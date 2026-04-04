export type AuthErrorCode =
  | "EMAIL_NOT_CONFIRMED"
  | "INVALID_CREDENTIALS"
  | "RATE_LIMIT"
  | "NETWORK"
  | "UNKNOWN";

export interface TranslatedError {
  code: AuthErrorCode;
  title: string;
  message: string;
  actionLabel?: string;
}

/**
 * Traduz erros “crus” (Supabase/HTTP) para mensagens de produto (sem vazamento de abstração).
 * Estética "Engineering Command Center" / "Industrial Premium".
 */
export function translateAuthError(rawMessage: string | undefined): TranslatedError {
  const msg = (rawMessage ?? "").toLowerCase();

  if (msg.includes("email not confirmed") || (msg.includes("email") && msg.includes("confirmed"))) {
    return {
      code: "EMAIL_NOT_CONFIRMED",
      title: "PROTOCOLO_PENDENTE",
      message: "Seu protocolo está quase pronto. Verifique o link de ativação no seu e-mail.",
      actionLabel: "VERIFICAR_INBOX",
    };
  }

  if (
    msg.includes("invalid login credentials") ||
    (msg.includes("invalid") && msg.includes("credentials")) ||
    (msg.includes("invalid") && msg.includes("password"))
  ) {
    return {
      code: "INVALID_CREDENTIALS",
      title: "ACESSO_NEGADO",
      message: "Acesso negado. Verifique suas coordenadas (E-mail/Senha).",
    };
  }

  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429")) {
    return {
      code: "RATE_LIMIT",
      title: "LIMITE_DE_REQUISIÇÕES",
      message: "Muitas tentativas detectadas. Sistema em cooldown para proteção da conta.",
    };
  }

  if (
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("timeout") ||
    msg.includes("offline")
  ) {
    return {
      code: "NETWORK",
      title: "ERRO_DE_TELEMETRIA",
      message: "Falha na conexão com o servidor. Verifique seu sinal de rede.",
    };
  }

  return {
    code: "UNKNOWN",
    title: "ERRO_SISTÊMICO",
    message: "Ocorreu uma falha inesperada no processamento. Tente novamente.",
  };
}
