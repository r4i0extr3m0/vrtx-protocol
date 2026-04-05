import { describe, expect, it } from "vitest";

import { getAuthRedirect } from "@/src/navigation/authGate";

describe("getAuthRedirect", () => {
  it("redireciona guest mode para tabs ao acessar rotas de auth", () => {
    const redirect = getAuthRedirect({
      pathname: "/login",
      status: "guest",
      isAuthenticated: false,
    });

    expect(redirect).toBe("/(tabs)");
  });

  it("permite guest mode nas tabs sem redirecionamento extra", () => {
    const redirect = getAuthRedirect({
      pathname: "/(tabs)",
      status: "guest",
      isAuthenticated: false,
    });

    expect(redirect).toBeNull();
  });

  it("mantem login acessivel para visitante nao autenticado", () => {
    const redirect = getAuthRedirect({
      pathname: "/login",
      status: "idle",
      isAuthenticated: false,
    });

    expect(redirect).toBeNull();
  });

  it("mantem onboarding acessivel para visitante nao autenticado", () => {
    const redirect = getAuthRedirect({
      pathname: "/onboarding",
      status: "idle",
      isAuthenticated: false,
    });

    expect(redirect).toBeNull();
  });

  it("leva para onboarding quando visitante tenta abrir rota protegida", () => {
    const redirect = getAuthRedirect({
      pathname: "/(tabs)",
      status: "idle",
      isAuthenticated: false,
    });

    expect(redirect).toBe("/onboarding");
  });

  it("leva para signup wizard quando o usuario autenticado ainda nao concluiu onboarding", () => {
    const redirect = getAuthRedirect({
      pathname: "/(tabs)",
      status: "authenticated",
      isAuthenticated: true,
      userOnboardingCompleted: false,
    });

    expect(redirect).toBe("/signup-wizard");
  });

  it("leva para tabs quando usuario autenticado tenta voltar para login", () => {
    const redirect = getAuthRedirect({
      pathname: "/login",
      status: "authenticated",
      isAuthenticated: true,
      userOnboardingCompleted: true,
    });

    expect(redirect).toBe("/(tabs)");
  });

  it("leva para tabs quando usuario autenticado com onboarding concluido tenta abrir onboarding", () => {
    const redirect = getAuthRedirect({
      pathname: "/onboarding",
      status: "authenticated",
      isAuthenticated: true,
      userOnboardingCompleted: true,
    });

    expect(redirect).toBe("/(tabs)");
  });

  it("mantem signup wizard acessivel para usuario autenticado com onboarding incompleto", () => {
    const redirect = getAuthRedirect({
      pathname: "/signup-wizard",
      status: "authenticated",
      isAuthenticated: true,
      userOnboardingCompleted: false,
    });

    expect(redirect).toBeNull();
  });
});
