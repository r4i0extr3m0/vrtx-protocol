import React, { useRef, useState } from "react";
import { 
  View, 
  Text, 
  Dimensions, 
  StyleSheet, 
  NativeScrollEvent, 
  NativeSyntheticEvent 
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/hooks";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { spacing, typography, radius } from "@/src/theme";
import Animated, {
  Extrapolate,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { 
  ScreenWrapper, 
  GlassCard, 
  NeonButton, 
  BadgeMetal 
} from "../components/ui";
import { AppIcon, IconName } from "../components/AppIcon";

const { width } = Dimensions.get("window");
const SCREEN_WIDTH = width;

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: IconName;
  status: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "hardware",
    title: "HARDWARE_CHECK",
    subtitle: "Sincronização de Sensores",
    description: "Conecte-se ao protocolo via biometria e sensores de movimento. Redundância total de dados local.",
    icon: "Cpu",
    status: "STATUS: CALIBRANDO",
  },
  {
    id: "biometrics",
    title: "BIOMETRIA_ANALYSIS",
    subtitle: "Reconhecimento de Performance",
    description: "Algoritmos avançados analisam sua biomecânica e progressão de carga em tempo real.",
    icon: "Fingerprint",
    status: "STATUS: ENCRYPTED",
  },
  {
    id: "telemetry",
    title: "TELEMETRIA_CORE",
    subtitle: "Métricas de Alta Precisão",
    description: "Logs técnicos de volume, 1RM e fadiga. Visualização de dados estilo Command Center.",
    icon: "Activity",
    status: "STATUS: OPERACIONAL",
  },
  {
    id: "protocol",
    title: "PROTOCOLO_VRTX",
    subtitle: "Iniciação do Sistema",
    description: "Você está prestes a entrar no ambiente de elite. Prepare seu hardware para a primeira missão.",
    icon: "Zap",
    status: "STATUS: PRONTO",
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

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== currentStep) {
      setCurrentStep(idx);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      markOnboardingComplete();
      router.replace("/signup-wizard");
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const next = currentStep + 1;
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, y: 0, animated: true });
      setCurrentStep(next);
    }
  };

  return (
    <ScreenWrapper withPadding={false}>
      <View style={styles.header}>
        <Animated.View entering={FadeIn.delay(200)} style={styles.progressContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <ProgressIndicator key={index} index={index} scrollX={scrollX} />
          ))}
        </Animated.View>
        <BadgeMetal label="VRTX v2.0" variant="metal" />
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
          <OnboardingSlide
            key={step.id}
            index={index}
            step={step}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <NeonButton 
          label={isLastStep ? "INICIAR_PROTOCOLO" : "PRÓXIMO_PASSO"} 
          onPress={handleNext}
          variant={isLastStep ? "primary" : "glass"}
          style={styles.button}
        />
        <Text style={[styles.version, { color: colors.muted, fontFamily: typography.family.mono }]}>
          SYSTEM_BOOT_SEQUENCE // REDUNDANCY_ACTIVE
        </Text>
      </View>
    </ScreenWrapper>
  );
}

function ProgressIndicator({ index, scrollX }: { index: number, scrollX: Animated.SharedValue<number> }) {
  const { colors } = useTheme();
  
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    const width = interpolate(scrollX.value, input, [8, 24, 8], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, input, [0.3, 1, 0.3], Extrapolate.CLAMP);
    
    return { width, opacity };
  });

  return (
    <Animated.View style={[
      styles.indicator, 
      { backgroundColor: colors.primary },
      style
    ]} />
  );
}

function OnboardingSlide({
  index,
  step,
  scrollX,
}: {
  index: number;
  step: OnboardingStep;
  scrollX: Animated.SharedValue<number>;
}) {
  const { colors } = useTheme();

  const iconStyle = useAnimatedStyle(() => {
    const x = scrollX.value - index * SCREEN_WIDTH;
    const translateX = interpolate(x, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-100, 0, 100], Extrapolate.CLAMP);
    const scale = interpolate(x, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [0.6, 1, 0.6], Extrapolate.CLAMP);
    const rotate = interpolate(x, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-20, 0, 20], Extrapolate.CLAMP);
    
    return {
      transform: [{ translateX }, { scale }, { rotate: `${rotate}deg` }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const x = scrollX.value - index * SCREEN_WIDTH;
    const opacity = interpolate(x, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [0, 1, 0], Extrapolate.CLAMP);
    const translateY = interpolate(x, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [20, 0, 20], Extrapolate.CLAMP);
    
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <View style={[styles.iconGlow, { backgroundColor: colors.primary + '20' }]} />
        <AppIcon name={step.icon} size={80} color={colors.primary} strokeWidth={1.5} />
      </Animated.View>

      <Animated.View style={[styles.content, textStyle]}>
        <BadgeMetal label={step.status} variant={index === 3 ? "primary" : "metal"} style={styles.statusBadge} />
        <Text style={[styles.title, { color: colors.foreground, fontFamily: typography.family.heading }]}>
          {step.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.primary, fontFamily: typography.family.mono }]}>
          {step.subtitle.toUpperCase()}
        </Text>
        
        <GlassCard style={styles.descCard} intensity={10}>
          <Text style={[styles.description, { color: colors.muted }]}>
            {step.description}
          </Text>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    height: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    height: 4,
    borderRadius: 2,
  },
  carousel: {
    flexGrow: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    filter: Platform.OS === 'ios' ? 'blur(30px)' : undefined,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  statusBadge: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 24,
  },
  descCard: {
    width: '100%',
    padding: 0,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
  version: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.5,
  },
});
