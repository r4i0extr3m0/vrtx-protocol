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
 * Traduz erros brutos (Supabase/HTTP) para mensagens claras e amigaveis.
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
      title: "E-mail invalido",
      message: "O e-mail informado nao parece valido. Revise o endereco e tente novamente.",
    };
  }

  if (
    msg.includes("invalid login credentials") ||
    (msg.includes("invalid") && msg.includes("credentials")) ||
    (msg.includes("invalid") && msg.includes("password"))
  ) {
    return {
      code: "INVALID_CREDENTIALS",
      title: "Nao foi possivel entrar",
      message: "E-mail ou senha incorretos. Confira os dados e tente novamente.",
    };
  }

  if (msg.includes("user already registered") || msg.includes("already exists") || msg.includes("user_already_exists")) {
    return {
      code: "USER_ALREADY_EXISTS",
      title: "Conta ja existente",
      message: "Este e-mail ja esta cadastrado. Entre com sua senha ou recupere o acesso.",
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
      title: "Senha muito fraca",
      message: "Use uma senha mais forte, com pelo menos 6 caracteres.",
    };
  }

  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429")) {
    return {
      code: "RATE_LIMIT",
      title: "Muitas tentativas",
      message: "Voce tentou varias vezes em pouco tempo. Aguarde um momento e tente de novo.",
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
      title: "Problema de conexao",
      message: "Nao foi possivel falar com o servidor. Verifique sua internet e tente novamente.",
    };
  }

  return {
    code: "UNKNOWN",
    title: "Algo deu errado",
    message: "Ocorreu uma falha inesperada. Tente novamente em instantes.",
  };
}
