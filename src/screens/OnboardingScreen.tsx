import React, { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Dimensions, StyleSheet, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/hooks";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { spacing, typography, radius, shadows } from "@/src/theme";
import Animated, {
  Extrapolate,
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width;

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bullets: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "offline",
    title: "Offline-First",
    description: "Treine em qualquer lugar. O VRTX Protocol funciona 100% offline e sincroniza quando você estiver online.",
    icon: "📡",
    color: "#7CC6FF",
    bullets: ["Registre treinos sem internet", "Sincronização automática", "Sem travar no meio da sessão"],
  },
  {
    id: "privacy",
    title: "Privacidade Total",
    description: "Seus dados são criptografados localmente. Você tem o controle total do seu histórico.",
    icon: "🔒",
    color: "#39D98A",
    bullets: ["Armazenamento criptografado", "Você controla exportação", "Conta com biometria (opcional)"],
  },
  {
    id: "ai",
    title: "IA com Contexto",
    description: "Insights e Coach com base nos seus treinos, dieta e medições — sem papo genérico.",
    icon: "🥗",
    color: "#F5B942",
    bullets: ["Recomendações acionáveis", "Explicações claras", "Limites no Free, completo no Premium"],
  },
  {
    id: "gamification",
    title: "Evolução Constante",
    description: "Ganhe XP, desbloqueie badges e mantenha seu streak ativo para alcançar o próximo nível.",
    icon: "🏆",
    color: "#4AA8F0",
    bullets: ["Streak e XP", "Metas diárias", "Progressão por exercício"],
  },
];

export function OnboardingScreen() {
  const { colors } = useTheme();
  const { markOnboardingComplete } = useOnboardingStore();

  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const progress = useDerivedValue(() => scrollX.value / CARD_WIDTH);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setCurrentStep(idx);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isLastStep) {
      markOnboardingComplete();
      router.replace("/signup-wizard");
    } else {
      const next = currentStep + 1;
      scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, y: 0, animated: true });
      setCurrentStep(next);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markOnboardingComplete();
    router.replace("/signup-wizard");
  };

  const backgroundStyle = useMemo(
    () => [StyleSheet.absoluteFill, { backgroundColor: colors.background }],
    [colors.background]
  );

  return (
    <View style={styles.container}>
      <View style={backgroundStyle} />
      <LinearGradient colors={["rgba(124, 198, 255, 0.08)", "transparent"]} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <Animated.View entering={FadeIn.delay(200)} style={styles.progressContainer}>
          {ONBOARDING_STEPS.map((s, index) => (
            <ProgressPill key={s.id} index={index} progress={progress} activeColor={s.color} inactiveColor={colors.border} />
          ))}
        </Animated.View>
        <Pressable onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.muted }]}>Pular</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={styles.carousel}
      >
        {ONBOARDING_STEPS.map((step, index) => (
          <OnboardingCard
            key={step.id}
            index={index}
            step={step}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={handleNext} style={styles.buttonWrapper}>
          <LinearGradient
            colors={colors.brandGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, shadows.card]}
          >
            <Text style={styles.buttonText}>{isLastStep ? "Começar" : "Continuar"}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function ProgressPill({
  index,
  progress,
  activeColor,
  inactiveColor,
}: {
  index: number;
  progress: Animated.SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}) {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(progress.value - index);
    const w = interpolate(distance, [0, 1], [26, 10], Extrapolate.CLAMP);
    const opacity = interpolate(distance, [0, 1.25], [1, 0.35], Extrapolate.CLAMP);
    return { width: w, opacity };
  });

  return (
    <Animated.View
      style={[
        styles.progressPill,
        style,
        {
          backgroundColor: index <= Math.round(progress.value) ? activeColor : inactiveColor,
        },
      ]}
    />
  );
}

function OnboardingCard({
  index,
  step,
  scrollX,
}: {
  index: number;
  step: OnboardingStep;
  scrollX: Animated.SharedValue<number>;
}) {
  const { colors } = useTheme();

  const animatedCard = useAnimatedStyle(() => {
    const x = scrollX.value - index * CARD_WIDTH;
    const rotateY = interpolate(x, [-CARD_WIDTH, 0, CARD_WIDTH], [18, 0, -18], Extrapolate.CLAMP);
    const scale = interpolate(x, [-CARD_WIDTH, 0, CARD_WIDTH], [0.96, 1, 0.96], Extrapolate.CLAMP);
    const opacity = interpolate(x, [-CARD_WIDTH, 0, CARD_WIDTH], [0.35, 1, 0.35], Extrapolate.CLAMP);
    return {
      opacity,
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }, { scale }],
    };
  });

  const floating = useAnimatedStyle(() => {
    const x = scrollX.value - index * CARD_WIDTH;
    const translateY = interpolate(x, [-CARD_WIDTH, 0, CARD_WIDTH], [8, 0, 8], Extrapolate.CLAMP);
    return { transform: [{ translateY }] };
  });

  return (
    <View style={{ width: CARD_WIDTH, paddingHorizontal: spacing.xl }}>
      <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, animatedCard]}>
        <LinearGradient
          colors={[`${step.color}24`, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View style={[styles.heroBadge, floating]}>
          <LinearGradient colors={[step.color, "#ffffff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBadgeGradient}>
            <Text style={styles.icon}>{step.icon}</Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.textWrapper}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
          <Text style={[styles.stepDesc, { color: colors.muted }]}>{step.description}</Text>
        </View>

        <View style={styles.bullets}>
          {step.bullets.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: step.color }]} />
              <Text style={[styles.bulletText, { color: colors.text }]}>{b}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginRight: spacing.xl,
  },
  progressPill: { height: 6, borderRadius: 99 },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  carousel: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.xxxl,
    padding: spacing.xl,
    minHeight: 520,
    overflow: "hidden",
    gap: spacing.lg,
  },
  heroBadge: {
    alignSelf: "center",
    width: 132,
    height: 132,
    borderRadius: 66,
    overflow: "hidden",
  },
  heroBadgeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 64,
  },
  textWrapper: {
    alignItems: 'center',
    gap: spacing.md,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  stepDesc: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  bullets: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bulletText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: spacing.xl,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});
