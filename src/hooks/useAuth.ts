import { useMemo } from "react";

import { useAuthStore } from "@/src/store/authStore";

export function useAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const signUp = useAuthStore((state) => state.signUp);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const setGuestMode = useAuthStore((state) => state.setGuestMode);

  return useMemo(
    () => ({
      isAuthenticated,
      user,
      session,
      status,
      hydrateAuth,
      signUp,
      signIn,
      signOut,
      setGuestMode,
    }),
    [hydrateAuth, isAuthenticated, session, setGuestMode, signIn, signOut, signUp, status, user],
  );
}
