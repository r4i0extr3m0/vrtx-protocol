import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { AppIcon } from "@/src/components/AppIcon";
import { WebBrand } from "./WebChrome";
import { useAuth, useTheme } from "@/src/hooks";
import { typography } from "@/src/theme";

const slides = [
  { kicker: "01 / CLAREZA", title: "Treine com um plano que acompanha você.", copy: "O VRTX organiza o seu dia em uma sequência simples: saber o que fazer, executar bem e entender o que mudou.", icon: "Dumbbell", stat: "01", meta: "Treino com intenção" },
  { kicker: "02 / NUTRIÇÃO", title: "Alimente a evolução, sem transformar tudo em ruído.", copy: "Registre o essencial, enxergue padrões e mantenha a alimentação trabalhando a favor do seu objetivo.", icon: "Apple", stat: "02", meta: "Rotina que sustenta" },
  { kicker: "03 / PROGRESSO", title: "Veja a consistência virar evidência.", copy: "Seu histórico, suas métricas e o coach de IA no mesmo lugar para a próxima decisão ficar mais clara.", icon: "TrendingUp", stat: "03", meta: "Progresso visível" },
];

export function WebOnboardingScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const goNext = () => active === slides.length - 1 ? router.replace("/login") : setActive((value) => value + 1);
  const goForward = () => router.replace(isAuthenticated && !user?.onboardingCompleted ? "/signup-wizard" : "/login");
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={styles.grid} />
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: colors.primary + "18" }]} />
      <View style={styles.nav}><WebBrand /><View style={styles.navRight}><Text style={[styles.navMeta, { color: colors.muted }]}>A COACHING SYSTEM FOR REAL LIFE</Text><Pressable onPress={goForward}><Text style={[styles.skip, { color: colors.foregroundMuted }]}>{isAuthenticated && !user?.onboardingCompleted ? "Abrir configuração" : "Pular introdução"}</Text></Pressable></View></View>
      <View style={[styles.content, width < 900 && styles.contentNarrow]}>
        <View style={styles.copyColumn}>
          <Text style={[styles.kicker, { color: colors.primary }]}>{slide.kicker}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{slide.title}</Text>
          <Text style={[styles.copy, { color: colors.foregroundMuted }]}>{slide.copy}</Text>
          <View style={styles.controls}><Pressable onPress={goNext} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, pressed && { opacity: 0.78 }]}><Text style={styles.primaryText}>{active === slides.length - 1 ? "Entrar no VRTX" : "Continuar"}</Text><AppIcon name="ChevronRight" size={17} color="#06111D" /></Pressable><Pressable onPress={goForward} style={styles.textButton}><Text style={[styles.textButtonText, { color: colors.foregroundMuted }]}>Já tenho acesso</Text></Pressable></View>
          <View style={styles.progressRow}>{slides.map((item, index) => <Pressable key={item.stat} onPress={() => setActive(index)} style={[styles.progressTrack, { backgroundColor: colors.border }]}><View style={[styles.progressFill, { backgroundColor: colors.primary, width: index <= active ? "100%" : "0%" }]} /></Pressable>)}</View>
        </View>
        <View style={[styles.featurePanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.panelTop}><View style={[styles.iconBox, { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "55" }]}><AppIcon name={slide.icon} size={26} color={colors.primary} /></View><Text style={[styles.panelIndex, { color: colors.muted }]}>{slide.stat}</Text></View>
          <View style={styles.panelVisual}><View style={[styles.ring, { borderColor: colors.primary + "55" }]}><View style={[styles.ringInner, { backgroundColor: colors.primary }]}><AppIcon name={slide.icon} size={34} color="#06111D" /></View></View><View style={[styles.line, styles.lineOne, { backgroundColor: colors.primary + "55" }]} /><View style={[styles.line, styles.lineTwo, { backgroundColor: colors.border }]} /><Text style={[styles.visualLabel, { color: colors.muted }]}>{slide.meta}</Text></View>
          <View style={[styles.panelFooter, { borderTopColor: colors.border }]}><Text style={[styles.panelEyebrow, { color: colors.muted }]}>VRTX PROTOCOL</Text><Text style={[styles.panelTitle, { color: colors.foreground }]}>Menos ruído. Mais prática.</Text></View>
        </View>
      </View>
      <View style={styles.footer}><Text style={[styles.footerText, { color: colors.muted }]}>Treino · Nutrição · IA · Progresso</Text><Text style={[styles.footerText, { color: colors.muted }]}>02.26 — v2</Text></View>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, minHeight: "100vh" as any, paddingHorizontal: 56, paddingVertical: 30, overflow: "hidden" },
  grid: ({ position: "absolute", inset: 0 as any, opacity: 0.2, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "56px 56px" } as any),
  glow: { position: "absolute", width: 620, height: 620, borderRadius: 400, right: -220, top: -170, opacity: 0.85 },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 1 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 34 },
  navMeta: { fontFamily: typography.family.mono, fontSize: 10, letterSpacing: 1.5 },
  skip: { fontSize: 12, fontWeight: "800" },
  content: { flex: 1, maxWidth: 1200 as any, width: "100%" as any, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 90, zIndex: 1 },
  contentNarrow: { gap: 30 },
  copyColumn: { flex: 1, maxWidth: 570 as any, gap: 20 },
  kicker: { fontFamily: typography.family.mono, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  title: { fontSize: 58, lineHeight: 63, fontWeight: "900", letterSpacing: -2.4 },
  copy: { fontSize: 17, lineHeight: 28, maxWidth: 500 as any },
  controls: { flexDirection: "row", alignItems: "center", gap: 24, marginTop: 14 },
  primary: { minHeight: 52, borderRadius: 14, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 10 },
  primaryText: { color: "#06111D", fontSize: 13, fontWeight: "900" },
  textButton: { paddingVertical: 14 },
  textButtonText: { fontSize: 13, fontWeight: "800" },
  progressRow: { flexDirection: "row", gap: 8, marginTop: 48 },
  progressTrack: { width: 50, height: 3, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%" as any, borderRadius: 4 },
  featurePanel: { width: 390, height: 490, borderRadius: 28, borderWidth: 1, padding: 24, justifyContent: "space-between", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 18 }, elevation: 10 },
  panelTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBox: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  panelIndex: { fontFamily: typography.family.mono, fontSize: 12, letterSpacing: 1.5 },
  panelVisual: { flex: 1, justifyContent: "center", alignItems: "center", position: "relative" },
  ring: { width: 202, height: 202, borderRadius: 110, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  ringInner: { width: 92, height: 92, borderRadius: 46, justifyContent: "center", alignItems: "center", shadowColor: "#8CC8FF", shadowOpacity: 0.6, shadowRadius: 25, shadowOffset: { width: 0, height: 0 } },
  line: { position: "absolute", height: 1, width: 106, left: 12, top: "50%" as any },
  lineOne: { transform: [{ rotate: "-27deg" }] },
  lineTwo: { transform: [{ rotate: "27deg" }] },
  visualLabel: { position: "absolute", bottom: 4, fontFamily: typography.family.mono, fontSize: 10, letterSpacing: 1.2 },
  panelFooter: { borderTopWidth: 1, paddingTop: 17, gap: 7 },
  panelEyebrow: { fontFamily: typography.family.mono, fontSize: 9, letterSpacing: 1.5 },
  panelTitle: { fontSize: 18, fontWeight: "900" },
  footer: { flexDirection: "row", justifyContent: "space-between", zIndex: 1 },
  footerText: { fontFamily: typography.family.mono, fontSize: 10, letterSpacing: 1 },
});
