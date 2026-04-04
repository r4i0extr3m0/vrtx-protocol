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
 * Não depende de SDK específico: opera em strings.
 */
export function translateAuthError(rawMessage: string | undefined): TranslatedError {
  const msg = (rawMessage ?? "").toLowerCase();

  if (msg.includes("email not confirmed") || msg.includes("email") && msg.includes("confirmed")) {
    return {
      code: "EMAIL_NOT_CONFIRMED",
      title: "Quase lá!",
      message: "Confirme seu e-mail para ativar sua conta e iniciar seu protocolo.",
      actionLabel: "Verificar e-mail",
    };
  }

  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid") && msg.includes("credentials") ||
    msg.includes("invalid") && msg.includes("password")
  ) {
    return {
      code: "INVALID_CREDENTIALS",
      title: "Credenciais incorretas",
      message: "E-mail ou senha inválidos. Verifique e tente novamente.",
    };
  }

  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429")) {
    return {
      code: "RATE_LIMIT",
      title: "Muitas tentativas",
      message: "Aguarde um pouco e tente novamente. Isso protege sua conta contra abuso.",
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
      title: "Sem conexão",
      message: "Não conseguimos conectar agora. Verifique sua internet e tente novamente.",
    };
  }

  return {
    code: "UNKNOWN",
    title: "Algo não saiu como esperado",
    message: "Não foi possível concluir agora. Tente novamente em instantes.",
  };
}

