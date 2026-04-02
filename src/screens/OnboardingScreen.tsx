import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Dimensions, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/hooks";
import { useOnboardingStore } from "@/src/store/onboardingStore";
import { spacing, typography, radius, shadows } from "@/src/theme";
import Animated, { FadeInDown, FadeOutUp, FadeIn, ZoomIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "offline",
    title: "Offline-First",
    description: "Treine em qualquer lugar. O CoreIronTrack funciona 100% offline e sincroniza quando você estiver online.",
    icon: "📡",
    color: "#7CC6FF",
  },
  {
    id: "privacy",
    title: "Privacidade Total",
    description: "Seus dados são criptografados localmente. Você tem o controle total do seu histórico.",
    icon: "🔒",
    color: "#39D98A",
  },
  {
    id: "ai",
    title: "Nutrição Inteligente",
    description: "Use nossa IA para analisar suas refeições por foto e bater suas metas de macros.",
    icon: "🥗",
    color: "#F5B942",
  },
  {
    id: "gamification",
    title: "Evolução Constante",
    description: "Ganhe XP, desbloqueie badges e mantenha seu streak ativo para alcançar o próximo nível.",
    icon: "🏆",
    color: "#4AA8F0",
  },
];

export function OnboardingScreen() {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const { markOnboardingComplete } = useOnboardingStore();

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isLastStep) {
      markOnboardingComplete();
      router.replace("/signup-wizard");
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markOnboardingComplete();
    router.replace("/signup-wizard");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['rgba(124, 198, 255, 0.05)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <Animated.View entering={FadeIn.delay(300)} style={styles.progressContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.progressBar, 
                { 
                  backgroundColor: index <= currentStep ? step.color : colors.border,
                  flex: index === currentStep ? 2 : 1
                }
              ]} 
            />
          ))}
        </Animated.View>
        <Pressable onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.muted }]}>Pular</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Animated.View key={step.id} entering={FadeInDown} exiting={FadeOutUp} style={styles.stepContent}>
          <Animated.View entering={ZoomIn.delay(200)} style={[styles.iconWrapper, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card]}>
             <Text style={styles.icon}>{step.icon}</Text>
          </Animated.View>
          
          <View style={styles.textWrapper}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
            <Text style={[styles.stepDesc, { color: colors.muted }]}>{step.description}</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={handleNext} style={styles.buttonWrapper}>
          <LinearGradient
            colors={colors.brandGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, shadows.card]}
          >
            <Text style={styles.buttonText}>{isLastStep ? "Começar Agora" : "Continuar"}</Text>
          </LinearGradient>
        </Pressable>
      </View>
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
    gap: 6,
    flex: 1,
    marginRight: spacing.xl,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  stepContent: {
    alignItems: 'center',
    gap: spacing.xxl,
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
