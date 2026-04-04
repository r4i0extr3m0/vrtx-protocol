import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, Pressable, Dimensions, StyleSheet, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/hooks";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { spacing, typography, radius, shadows } from "@/src/theme";
import Animated, {
  Extrapolate,
  FadeIn,
  FadeInRight,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import { ScreenBackdrop } from "../components/ScreenBackdrop";

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
    title: "SISTEMA OFFLINE",
    description: "Protocolo de redundância ativado. O VRTX funciona 100% offline com sincronização em tempo real.",
    icon: "📡",
    color: "#7CC6FF",
    bullets: ["Logs locais redundantes", "Sincronização de alta prioridade", "Operação contínua sem rede"],
  },
  {
    id: "privacy",
    title: "CRIPTOGRAFIA CORE",
    description: "Seus dados são protegidos por camadas de segurança local. Controle total do seu histórico.",
    icon: "🔒",
    color: "#39D98A",
    bullets: ["Criptografia de nível militar", "Exportação técnica de dados", "Acesso via Biometria"],
  },
  {
    id: "ai",
    title: "MÓDULO DE IA",
    description: "Análise preditiva e coach baseado em performance real. Sem dados genéricos, apenas resultados.",
    icon: "🥗",
    color: "#F5B942",
    bullets: ["Insights baseados em carga", "Otimização de macronutrientes", "Coach de execução técnico"],
  },
  {
    id: "gamification",
    title: "PROGRESSÃO VRTX",
    description: "Acumule XP e suba na hierarquia do protocolo. Mantenha o streak para máxima eficiência.",
    icon: "🏆",
    color: "#4AA8F0",
    bullets: ["Hierarquia de XP", "Badges de conquista técnica", "Logs de desempenho recorde"],
  },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
    if (idx !== currentStep) {
      setCurrentStep(idx);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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

  return (
    <View style={styles.container}>
      <ScreenBackdrop />
      
      <View style={styles.header}>
        <Animated.View entering={FadeIn.delay(200)} style={styles.progressContainer}>
          {ONBOARDING_STEPS.map((s, index) => (
            <ProgressPill key={s.id} index={index} progress={progress} activeColor={s.color} inactiveColor={colors.border} />
          ))}
        </Animated.View>
        <Pressable onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.muted }]}>SKIP_BOOT</Text>
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
            <Text style={styles.buttonText}>{isLastStep ? "INICIAR_SISTEMA" : "PRÓXIMO_PASSO"}</Text>
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

function TypewriterText({ text, style, delay = 0 }: { text: string, style: any, delay?: number }) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let i = 0;
    setDisplayedText("");
    
    const type = () => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        timeout = setTimeout(type, 30);
      }
    };
    
    const startTimeout = setTimeout(type, delay);
    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeout);
    };
  }, [text]);

  return <Text style={style}>{displayedText}</Text>;
}

function ActivityGauge({ color, active }: { color: string, active: boolean }) {
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    if (active) {
      rotation.value = withRepeat(withTiming(360, { duration: 3000 }), -1, false);
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const radius = 70;
  const strokeWidth = 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <Animated.View style={[styles.gaugeContainer, animatedStyle]}>
      <Svg width={160} height={160} viewBox="0 0 160 160">
        <G rotation="-90" origin="80, 80">
          <Circle
            cx="80"
            cy="80"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference * 0.7} ${circumference * 0.3}`}
            strokeLinecap="round"
            opacity={0.6}
          />
        </G>
      </Svg>
    </Animated.View>
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
    const translateY = interpolate(x, [-CARD_WIDTH, 0, CARD_WIDTH], [20, 0, 20], Extrapolate.CLAMP);
    const opacity = interpolate(x, [-CARD_WIDTH, 0, CARD_WIDTH], [0, 1, 0], Extrapolate.CLAMP);
    const scale = interpolate(x, [-CARD_WIDTH, 0, CARD_WIDTH], [0.9, 1, 0.9], Extrapolate.CLAMP);
    
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    const x = scrollX.value - index * CARD_WIDTH;
    const scale = interpolate(x, [-CARD_WIDTH, 0, CARD_WIDTH], [0.5, 1, 0.5], Extrapolate.CLAMP);
    const rotate = interpolate(x, [-CARD_WIDTH, 0, CARD_WIDTH], [-45, 0, 45], Extrapolate.CLAMP);
    
    return {
      transform: [{ scale }, { rotate: `${rotate}deg` }],
    };
  });

  const isActive = useDerivedValue(() => {
    return Math.round(scrollX.value / CARD_WIDTH) === index;
  });

  return (
    <View style={{ width: CARD_WIDTH, paddingHorizontal: spacing.xl }}>
      <Animated.View style={[styles.card, { backgroundColor: "transparent", borderColor: colors.border }, animatedCard]}>
        <LinearGradient
          colors={["#1A1A1A", "#121212"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { borderWidth: 0.5, borderColor: colors.border, borderRadius: radius.xxxl }]} />

        <View style={styles.heroSection}>
          <ActivityGauge color={step.color} active={true} />
          <Animated.View style={[styles.heroBadge, iconStyle]}>
            <Text style={styles.icon}>{step.icon}</Text>
          </Animated.View>
        </View>

        <View style={styles.textWrapper}>
          <Animated.View entering={FadeInRight.delay(300).springify()}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
          </Animated.View>
          <TypewriterText 
            text={step.description} 
            style={[styles.stepDesc, { color: colors.muted }]} 
            delay={600}
          />
        </View>

        <View style={styles.bullets}>
          {step.bullets.map((b, i) => (
            <Animated.View 
              key={b} 
              entering={FadeInRight.delay(1000 + i * 100).springify()}
              style={styles.bulletRow}
            >
              <View style={[styles.bulletDot, { backgroundColor: step.color }]} />
              <Text style={[styles.bulletText, { color: colors.foregroundMuted }]}>{b}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginRight: spacing.xl,
  },
  progressPill: { height: 4, borderRadius: 2 },
  skipText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  carousel: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  card: {
    borderRadius: radius.xxxl,
    padding: spacing.xl,
    minHeight: 520,
    overflow: "hidden",
    gap: spacing.lg,
  },
  heroSection: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeContainer: {
    position: "absolute",
  },
  heroBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  icon: {
    fontSize: 48,
  },
  textWrapper: {
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 100,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  stepDesc: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: "monospace",
  },
  bullets: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.05)",
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    fontFamily: "monospace",
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
