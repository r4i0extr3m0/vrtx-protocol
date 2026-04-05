export type AuthErrorCode =
  | "INVALID_EMAIL"
  | "INVALID_CREDENTIALS"
  | "USER_ALREADY_EXISTS"
  | "WEAK_PASSWORD"
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

  if (
    msg.includes("invalid email") ||
    msg.includes("email address is invalid") ||
    msg.includes("unable to validate email address")
  ) {
    return {
      code: "INVALID_EMAIL",
      title: "COORDENADA_INVÁLIDA",
      message: "O e-mail informado não é válido. Revise o endereço e tente novamente.",
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

  if (msg.includes("user already registered") || msg.includes("already exists") || msg.includes("user_already_exists")) {
    return {
      code: "USER_ALREADY_EXISTS",
      title: "CONTA_JÁ_EXISTENTE",
      message: "Este e-mail já possui cadastro. Entre com sua senha ou use recuperação de acesso.",
      actionLabel: "Entrar",
    };
  }

  if (
    msg.includes("password should be at least") ||
    msg.includes("password is too weak") ||
    msg.includes("weak password")
  ) {
    return {
      code: "WEAK_PASSWORD",
      title: "SENHA_INSUFICIENTE",
      message: "Use uma senha mais forte, com pelo menos 6 caracteres.",
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
