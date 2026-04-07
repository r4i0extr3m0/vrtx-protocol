import "../global.css";
import * as Sentry from "@sentry/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, SplashScreen, usePathname, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { getAuthRedirect } from "@/src/navigation/authGate";
import { initializeMMKV } from "@/src/infra/mmkv";
import { useAuth } from "@/src/hooks";
import { AppFeedbackProvider } from "@/src/providers/AppFeedbackProvider";
import { initMonitoring } from "@/src/services/monitoring";
import { identifyUser } from "@/src/services/analytics";
import { configureRevenueCat, loginRevenueCat, logoutRevenueCat } from "@/src/services/revenuecat";

// Storybook Integration
const SHOW_STORYBOOK = process.env.EXPO_PUBLIC_STORYBOOK === "true";
const StorybookUIRoot = SHOW_STORYBOOK
  ? lazy(async () => {
      const module = (await import("../.storybook")) as { default?: ComponentType };
      return {
        default: module.default ?? (() => null),
      };
    })
  : null;

// Inicializa Sentry
initMonitoring();

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
  anchor: "(tabs)",
};

function AuthGate() {
  const { status, isAuthenticated, user, hasHydrated, hydrateAuth } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [bootCompleted, setBootCompleted] = useState(false);

  useEffect(() => {
    initializeMMKV();
    void configureRevenueCat();

    let isMounted = true;

    const hydrationTimeout = setTimeout(() => {
      console.warn("[AuthGate] hydrateAuth timeout após 6s");
      if (isMounted) {
        setBootCompleted(true);
      }
      void SplashScreen.hideAsync();
    }, 6000);

    void hydrateAuth()
      .catch((error) => {
        console.error("[AuthGate] hydrateAuth error:", error);
      })
      .finally(() => {
        clearTimeout(hydrationTimeout);
        if (isMounted) {
          setBootCompleted(true);
        }
        void SplashScreen.hideAsync();
      });

    return () => {
      isMounted = false;
      clearTimeout(hydrationTimeout);
    };
  }, [hydrateAuth]);

  // Analytics: Identificar usuário quando autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      identifyUser(user.id, { email: user.email, name: user.name });
      void loginRevenueCat(user.id);
    } else {
      void logoutRevenueCat();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!hasHydrated || !bootCompleted || status === "loading") {
      return;
    }

    const redirectPath = getAuthRedirect({
      pathname,
      status,
      isAuthenticated,
      userOnboardingCompleted: user?.onboardingCompleted,
    });

    if (redirectPath && redirectPath !== pathname) {
      router.replace(redirectPath as Href);
    }
  }, [
    bootCompleted,
    hasHydrated,
    isAuthenticated,
    pathname,
    router,
    status,
    user,
  ]);

  if (!hasHydrated || !bootCompleted || status === "loading") {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "ios" ? "default" : "fade_from_bottom",
        contentStyle: { backgroundColor: "#0B0D10" },
        animationDuration: 400,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="camera" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="sync-status" options={{ presentation: "modal" }} />
    </Stack>
  );
}

function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics;
    if (!metrics) return undefined;
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, []);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {SHOW_STORYBOOK && StorybookUIRoot ? (
            <Suspense fallback={null}>
              <StorybookUIRoot />
            </Suspense>
          ) : (
            <AuthGate />
          )}
          <StatusBar style="light" />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        <AppFeedbackProvider>{content}</AppFeedbackProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
