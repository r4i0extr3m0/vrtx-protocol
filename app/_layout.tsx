import "../global.css";
import * as Sentry from "@sentry/react-native";
import { PostHogProvider } from "posthog-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Text, View } from "react-native";
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
import { spacing, typography } from "@/src/theme";
import { initMonitoring, initFirebase } from "@/src/services/monitoring";
import { identifyUser } from "@/src/services/analytics";
import { AnimatedStack } from "@/src/components/AnimatedStack";
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
  const { status, isAuthenticated, user, hydrateAuth } = useAuth();
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);

  useEffect(() => {
    initializeMMKV();
    void configureRevenueCat();

    if (!hasSupabaseEnv()) {
      console.log("[AuthGate] Supabase não configurado, pulando hydration");
      void SplashScreen.hideAsync();
      return;
    }

    const hydrationTimeout = setTimeout(() => {
      console.warn("[AuthGate] hydrateAuth timeout após 6s");
      void SplashScreen.hideAsync();
    }, 6000);

    void hydrateAuth()
      .catch((error) => {
        console.error("[AuthGate] hydrateAuth error:", error);
      })
      .finally(() => {
        clearTimeout(hydrationTimeout);
        void SplashScreen.hideAsync();
      });

    return () => {
      clearTimeout(hydrationTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analytics: Identificar usuário quando autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      identifyUser(user.id, { email: user.email, name: user.name });
      void loginRevenueCat(user.id);
    } else {
      void logoutRevenueCat();
    }
  }, [isAuthenticated, user]);

  const shouldBypassAuthInDev = __DEV__ && !isAuthenticated;

  // Mostrar loading apenas se estiver em estado "loading"
  if (status === "loading") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.xl,
          backgroundColor: "#0D0D0D",
        }}
      >
        <Text style={{ 
          color: "#7CC6FF", 
          fontSize: 12, 
          fontWeight: "900", 
          letterSpacing: 2,
          fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" 
        }}>
          BOOTING_VRTX_PROTOCOL...
        </Text>
      </View>
    );
  }

  return (
    <AnimatedStack>
      {shouldBypassAuthInDev ? (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout/[id]" />
          <Stack.Screen name="history/[id]" />
          <Stack.Screen name="exercises" />
          <Stack.Screen name="templates" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="gamification" />
          <Stack.Screen name="diet/index" />
          <Stack.Screen name="diet/add-meal" />
          <Stack.Screen name="diet/goals" />
          <Stack.Screen name="camera" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="sync-status" options={{ presentation: "modal" }} />
        </>
      ) : !isAuthenticated ? (
        <>
          {!hasSeenOnboarding ? <Stack.Screen name="onboarding" /> : null}
          <Stack.Screen name="login" />
          <Stack.Screen name="signup-wizard" />
        </>
      ) : (
        <>
          {user && !user.onboardingCompleted ? (
            <Stack.Screen name="signup-wizard" />
          ) : (
            <Stack.Screen name="(tabs)" />
          )}
          <Stack.Screen name="workout/[id]" />
          <Stack.Screen name="history/[id]" />
          <Stack.Screen name="exercises" />
          <Stack.Screen name="templates" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="gamification" />
          <Stack.Screen name="diet/index" />
          <Stack.Screen name="diet/add-meal" />
          <Stack.Screen name="diet/goals" />
          <Stack.Screen name="camera" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="sync-status" options={{ presentation: "modal" }} />
        </>
      )}
      <Stack.Screen name="oauth/callback" />
    </AnimatedStack>
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

  const wrappedContent = posthogApiKey ? (
    <PostHogProvider
      apiKey={posthogApiKey}
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
