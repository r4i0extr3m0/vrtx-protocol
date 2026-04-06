import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

import { AppIcon, type IconName } from "@/src/components/AppIcon";
import { useAuth, useTheme } from "@/src/hooks";
import { GlassCardLiquid, LiquidProgress, ParallaxLayer, ScreenWrapper, TiltCard3D } from "@/src/components/ui";
import { radius, spacing, typography } from "@/src/theme";

type SlideDefinition = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  footer: string;
  chips: string[];
  icon: IconName;
};

const SLIDES: SlideDefinition[] = [
  {
    key: "boot",
    eyebrow: "Primeiros passos",
    title: "Comece com clareza desde o primeiro toque.",
    description:
      "O VRTX Protocol combina profundidade visual, contraste forte e leitura facil para voce encontrar o que importa sem esforco.",
    footer: "Tudo pensado para deixar o inicio mais leve, claro e intuitivo.",
    chips: ["Visual fluido", "Leitura rapida", "Sem excessos"],
    icon: "Cpu",
  },
  {
    key: "command",
    eyebrow: "Tudo em um lugar",
    title: "Treino, nutricao e IA trabalhando lado a lado.",
    description:
      "Os principais modulos aparecem com hierarquia clara e transicoes suaves para voce alternar entre areas sem perder contexto.",
    footer: "Seu dia a dia fica mais organizado e facil de acompanhar.",
    chips: ["Treino", "Nutricao", "IA"],
    icon: "Zap",
  },
  {
    key: "elite",
    eyebrow: "Evolucao com foco",
    title: "Veja seu progresso com mais contraste e menos ruido.",
    description:
      "Cada tela destaca metricas, proximos passos e informacoes essenciais com um visual sobrio e confortavel de ler.",
    footer: "Mais clareza para decidir, treinar e seguir em frente.",
    chips: ["Progresso", "Clareza", "Consistencia"],
    icon: "TrendingUp",
  },
  {
    key: "execute",
    eyebrow: "Vamos comecar",
    title: "Tudo pronto para entrar e ajustar o app ao seu ritmo.",
    description:
      "Ao terminar esta apresentacao, voce segue para o login ou para a configuracao inicial, sem passos desnecessarios.",
    footer: "Voce entra rapido e continua de onde precisa.",
    chips: ["Login", "Setup", "VRTX"],
    icon: "Check",
  },
];

const FEATURE_ICONS: IconName[] = ["Dumbbell", "BarChart2", "Zap"];

export function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const progress = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const lastNotifiedIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const slideWidth = Math.max(width, 1);
  const currentSlide = SLIDES[activeIndex] ?? SLIDES[0];

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      progress.value = event.contentOffset.x / slideWidth;
    },
  });

  useEffect(() => {
    if (activeIndex === lastNotifiedIndex.current) {
      return;
    }

    lastNotifiedIndex.current = activeIndex;
    void Haptics.selectionAsync();
  }, [activeIndex]);

  const navigateAfterIntro = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isAuthenticated && !user?.onboardingCompleted) {
      router.replace("/signup-wizard");
      return;
    }

    router.replace("/login");
  }, [isAuthenticated, user?.onboardingCompleted]);

  const scrollToIndex = useCallback(
    (nextIndex: number) => {
      scrollRef.current?.scrollTo({ x: nextIndex * slideWidth, animated: true });
      setActiveIndex(nextIndex);
    },
    [slideWidth],
  );

  const handleNext = useCallback(() => {
    if (activeIndex >= SLIDES.length - 1) {
      navigateAfterIntro();
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrollToIndex(activeIndex + 1);
  }, [activeIndex, navigateAfterIntro, scrollToIndex]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
      setActiveIndex(Math.min(Math.max(nextIndex, 0), SLIDES.length - 1));
    },
    [slideWidth],
  );

  const stats = useMemo(
    () => [
      { label: "Camadas", value: "3" },
      { label: "Fluidez", value: "120" },
      { label: "Toque", value: "Ativo" },
    ],
    [],
  );

  return (
    <ScreenWrapper withPadding={false} style={[styles.container, { backgroundColor: "#0D0D0D" }]}>
      <View pointerEvents="none" style={styles.background}>
        <View style={[styles.orbLarge, { backgroundColor: "rgba(59,130,246,0.12)" }]} />
        <View style={[styles.orbSmall, { backgroundColor: "rgba(255,255,255,0.05)" }]} />
        <View style={[styles.gridLine, styles.gridTop, { borderColor: colors.border }]} />
        <View style={[styles.gridLine, styles.gridBottom, { borderColor: colors.border }]} />
      </View>

      <View style={styles.header}>
        <Text style={[styles.brand, { color: colors.foregroundMuted }]}>VRTX Protocol</Text>
        <Pressable onPress={navigateAfterIntro} hitSlop={12}>
          <Text style={[styles.skip, { color: colors.muted }]}>
            {isAuthenticated && !user?.onboardingCompleted ? "Ir para configuracao" : "Pular"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.progressBlock}>
        <LiquidProgress current={activeIndex} total={SLIDES.length} />
        <View style={styles.progressMeta}>
          <Text style={[styles.progressLabel, { color: colors.foregroundMuted }]}>{currentSlide.eyebrow}</Text>
          <Text style={[styles.progressCount, { color: colors.muted }]}>
            {String(activeIndex + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </Text>
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={styles.scrollContent}
      >
        {SLIDES.map((slide, index) => {
          return (
            <View key={slide.key} style={[styles.page, { width: slideWidth }]}>
              <TiltCard3D index={index} progress={progress} style={styles.cardTilt}>
                <GlassCardLiquid style={styles.card}>
                  <ParallaxLayer index={index} progress={progress} intensity={18} verticalIntensity={4}>
                    <View style={styles.cardTopRow}>
                      <View style={[styles.iconHalo, { borderColor: colors.borderStrong, backgroundColor: "rgba(255,255,255,0.03)" }]}>
                        <AppIcon name={slide.icon} color={colors.primary} size={28} />
                      </View>
                      <View style={styles.featurePills}>
                        {FEATURE_ICONS.map((iconName, featureIndex) => (
                          <View
                            key={`${slide.key}-feature-${featureIndex}`}
                            style={[styles.featureIconWrap, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: colors.border }]}
                          >
                            <AppIcon name={iconName} color={featureIndex === 1 ? colors.foreground : colors.primary} size={16} />
                          </View>
                        ))}
                      </View>
                    </View>
                  </ParallaxLayer>

                  <ParallaxLayer index={index} progress={progress} intensity={28} verticalIntensity={8}>
                    <Text style={[styles.eyebrow, { color: colors.foregroundMuted }]}>{slide.eyebrow}</Text>
                    <Text style={[styles.title, { color: colors.foreground }]}>{slide.title}</Text>
                    <Text style={[styles.description, { color: colors.muted }]}>{slide.description}</Text>
                  </ParallaxLayer>

                  <ParallaxLayer index={index} progress={progress} intensity={36} verticalIntensity={12} style={styles.chipRow}>
                    {slide.chips.map((chip) => (
                      <View key={`${slide.key}-${chip}`} style={[styles.chip, { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.035)" }]}>
                        <Text style={[styles.chipText, { color: colors.foregroundMuted }]}>{chip}</Text>
                      </View>
                    ))}
                  </ParallaxLayer>

                  <ParallaxLayer index={index} progress={progress} intensity={22} verticalIntensity={8}>
                    <View style={[styles.statsCard, { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.025)" }]}>
                      {stats.map((stat) => (
                        <View key={`${slide.key}-${stat.label}`} style={styles.statItem}>
                          <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
                          <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                        </View>
                      ))}
                    </View>
                  </ParallaxLayer>

                  <ParallaxLayer index={index} progress={progress} intensity={14} verticalIntensity={6}>
                    <View style={[styles.footerBar, { borderTopColor: colors.border }]}>
                      <Text style={[styles.footerText, { color: colors.foregroundMuted }]}>{slide.footer}</Text>
                    </View>
                  </ParallaxLayer>
                </GlassCardLiquid>
              </TiltCard3D>
            </View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.footerActions}>
        <Pressable onPress={navigateAfterIntro} style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}>
          <Text style={[styles.secondaryButtonText, { color: colors.foregroundMuted }]}>
            {isAuthenticated && !user?.onboardingCompleted ? "Abrir configuracao" : "Ir para login"}
          </Text>
        </Pressable>

        <Pressable onPress={handleNext} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryButtonText}>
            {activeIndex === SLIDES.length - 1 ? "Entrar no app" : "Continuar"}
          </Text>
          <AppIcon name={activeIndex === SLIDES.length - 1 ? "ChevronRight" : "ChevronRight"} color="#F8FAFC" size={18} />
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  orbLarge: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    top: 64,
    right: -70,
  },
  orbSmall: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    bottom: 120,
    left: -40,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    opacity: 0.3,
  },
  gridTop: {
    top: 120,
  },
  gridBottom: {
    bottom: 140,
  },
  header: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  skip: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  progressBlock: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  progressCount: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
  },
  scrollContent: {
    alignItems: "stretch",
  },
  page: {
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  cardTilt: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    minHeight: 540,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  iconHalo: {
    width: 58,
    height: 58,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featurePills: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.family.heading,
    fontSize: typography.size["3xl"],
    lineHeight: 38,
    letterSpacing: typography.letterSpacing.tight,
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: typography.family.body,
    fontSize: typography.size.md,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  chipText: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  statsCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  statItem: {
    gap: spacing.xs,
  },
  statLabel: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  statValue: {
    fontFamily: typography.family.heading,
    fontSize: typography.size["2xl"],
  },
  footerBar: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  footerText: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  footerActions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  primaryButtonText: {
    color: "#F8FAFC",
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
