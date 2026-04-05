export type AuthStatus = "idle" | "loading" | "authenticated" | "guest";

export interface AuthRedirectInput {
  pathname: string;
  status: AuthStatus;
  isAuthenticated: boolean;
  userOnboardingCompleted?: boolean;
}

export const PUBLIC_ROUTES = new Set([
  "/onboarding",
  "/login",
  "/signup-wizard",
  "/forgot-password",
  "/terms-and-privacy",
  "/oauth/callback",
]);

export const GUEST_REDIRECT_ROUTES = new Set([
  "/login",
  "/signup-wizard",
  "/forgot-password",
  "/oauth/callback",
]);

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname);
}

export function getAuthRedirect({
  pathname,
  status,
  isAuthenticated,
  userOnboardingCompleted,
}: AuthRedirectInput): string | null {
  if (status === "guest") {
    return GUEST_REDIRECT_ROUTES.has(pathname) ? "/(tabs)" : null;
  }

  if (!isAuthenticated) {
    return isPublicRoute(pathname) ? null : "/onboarding";
  }

  if (!userOnboardingCompleted) {
    return pathname === "/signup-wizard" ? null : "/signup-wizard";
  }

  if (
    pathname === "/onboarding" ||
    pathname === "/login" ||
    pathname === "/signup-wizard"
  ) {
    return "/(tabs)";
  }

  return null;
}
