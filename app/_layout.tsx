import "../global.css";
import * as Sentry from "@sentry/react-native";
import { PostHogProvider } from "posthog-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, SplashScreen, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { hasSupabaseEnv } from "@/src/constants/env";
import { initializeMMKV } from "@/src/infra/mmkv";
import { useAuth } from "@/src/hooks";
import { spacing } from "@/src/theme";
import { initMonitoring, initFirebase } from "@/src/services/monitoring";
import { identifyUser } from "@/src/services/analytics";
import { configureRevenueCat, loginRevenueCat, logoutRevenueCat } from "@/src/services/revenuecat";
import { useOnboardingStore } from "@/src/store/onboardingStore";

// Storybook Integration
const SHOW_STORYBOOK = process.env.EXPO_PUBLIC_STORYBOOK === "true";
let StorybookUIRoot: any = null;
if (SHOW_STORYBOOK) {
  StorybookUIRoot = require("../.storybook").default;
}

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

// Inicializa Sentry
initMonitoring();

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
  anchor: "(tabs)",
};

function AuthGate() {
  const { status, isAuthenticated, user, hasHydrated, hydrateAuth } = useAuth();
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated);
  const pathname = usePathname();
  const router = useRouter();
  const [bootCompleted, setBootCompleted] = useState(false);
  const shouldBypassAuthInDev = __DEV__ && !hasSupabaseEnv();

  useEffect(() => {
    initializeMMKV();
    void configureRevenueCat();

    if (!onboardingHydrated) {
      return;
    }

    let isMounted = true;

    if (!hasSupabaseEnv()) {
      console.log("[AuthGate] Supabase não configurado, pulando hydration");
      void hydrateAuth().finally(() => {
        if (isMounted) {
          setBootCompleted(true);
        }
        void SplashScreen.hideAsync();
      });
      return;
    }

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
  }, [hydrateAuth, onboardingHydrated]);

  // Analytics: Identificar usuário quando autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      identifyUser(user.id, { email: user.email, name: user.name });
      void loginRevenueCat(user.id);
    } else {
      void logoutRevenueCat();
    }
  }, [isAuthenticated, user]);

  const isPublicRoute =
    pathname === "/onboarding" ||
    pathname === "/login" ||
    pathname === "/signup-wizard" ||
    pathname === "/email-pending" ||
    pathname === "/forgot-password" ||
    pathname === "/terms-and-privacy" ||
    pathname === "/oauth/callback";

  useEffect(() => {
    if (!onboardingHydrated || !hasHydrated || !bootCompleted || status === "loading") {
      return;
    }

    if (shouldBypassAuthInDev && !isAuthenticated) {
      if (
        pathname === "/login" ||
        pathname === "/onboarding" ||
        pathname === "/signup-wizard" ||
        pathname === "/email-pending" ||
        pathname === "/forgot-password" ||
        pathname === "/terms-and-privacy" ||
        pathname === "/oauth/callback"
      ) {
        router.replace("/");
      }

      return;
    }

    if (!isAuthenticated) {
      if (!hasSeenOnboarding && pathname !== "/onboarding") {
        router.replace("/onboarding");
        return;
      }

      if (hasSeenOnboarding && !isPublicRoute) {
        router.replace("/login");
      }

      return;
    }

    if (user && !user.onboardingCompleted && pathname !== "/signup-wizard") {
      router.replace("/signup-wizard");
      return;
    }

    if (
      pathname === "/onboarding" ||
      pathname === "/login" ||
      (pathname === "/signup-wizard" && Boolean(user?.onboardingCompleted))
    ) {
      router.replace("/(tabs)");
    }
  }, [
    bootCompleted,
    hasHydrated,
    hasSeenOnboarding,
    isAuthenticated,
    isPublicRoute,
    onboardingHydrated,
    pathname,
    router,
    shouldBypassAuthInDev,
    status,
    user,
  ]);

  if (!onboardingHydrated || !hasHydrated || !bootCompleted || status === "loading") {
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
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

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
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;
  const shouldEnablePostHog = Platform.OS === "web" && Boolean(posthogApiKey);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {SHOW_STORYBOOK ? <StorybookUIRoot /> : <AuthGate />}
          <StatusBar style="light" />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const wrappedContent = shouldEnablePostHog ? (
    <PostHogProvider
      apiKey={posthogApiKey!}
      options={{ host: posthogHost || "https://us.i.posthog.com" }}
    >
      {content}
    </PostHogProvider>
  ) : (
    content
  );

  if (Platform.OS === "web") {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>{wrappedContent}</SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{wrappedContent}</SafeAreaProvider>
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
