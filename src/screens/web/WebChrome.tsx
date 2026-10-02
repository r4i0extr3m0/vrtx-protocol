import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppIcon } from "@/src/components/AppIcon";
import { useAuth, useTheme } from "@/src/hooks";
import { typography } from "@/src/theme";

export function WebBrand({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
        <View style={styles.brandMarkLine} />
        <View style={styles.brandMarkLine} />
      </View>
      {!compact ? <Text style={[styles.brandName, { color: colors.foreground }]}>VRTX</Text> : null}
    </View>
  );
}

const navItems = [
  { label: "Visão geral", icon: "Home", route: "/(tabs)" },
  { label: "Treino", icon: "Dumbbell", route: "/workout" },
  { label: "Nutrição", icon: "Apple", route: "/diet" },
  { label: "Progresso", icon: "BarChart", route: "/statistics" },
  { label: "Histórico", icon: "Clock", route: "/history" },
];

export function WebShell({ children, eyebrow = "Painel de controle", title = "Seu ritmo, com clareza." }: PropsWithChildren<{ eyebrow?: string; title?: string }>) {
  const { colors } = useTheme();
  const { user } = useAuth();
  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={styles.ambientGlow} />
      <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
        <WebBrand />
        <View style={styles.sideIntro}>
          <Text style={[styles.sideLabel, { color: colors.muted }]}>VRTX PROTOCOL</Text>
          <Text style={[styles.sideCopy, { color: colors.foregroundMuted }]}>Treino, nutrição e evolução em um só lugar.</Text>
        </View>
        <View style={styles.navList}>
          <Text style={[styles.navLabel, { color: colors.muted }]}>Navegação</Text>
          {navItems.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as never)}
              style={({ pressed }) => [styles.navItem, index === 0 && { backgroundColor: colors.primary + "18" }, pressed && { opacity: 0.72 }]}
            >
              <AppIcon name={item.icon} size={18} color={index === 0 ? colors.primary : colors.muted} />
              <Text style={[styles.navText, { color: index === 0 ? colors.foreground : colors.foregroundMuted }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.sideBottom, { borderTopColor: colors.border }]}>
          <Pressable onPress={() => router.push("/ai-coach" as never)} style={styles.aiLink}>
            <View style={[styles.aiIcon, { backgroundColor: colors.primary + "20" }]}><AppIcon name="Zap" size={16} color={colors.primary} /></View>
            <View style={styles.aiCopy}><Text style={[styles.aiTitle, { color: colors.foreground }]}>Coach IA</Text><Text style={[styles.aiHint, { color: colors.muted }]}>Uma leitura para hoje</Text></View>
          </Pressable>
          <Pressable onPress={() => router.push("/profile" as never)} style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{(user?.name ?? "V").slice(0, 1).toUpperCase()}</Text></View>
            <View style={styles.aiCopy}><Text numberOfLines={1} style={[styles.profileName, { color: colors.foreground }]}>{user?.name ?? "Visitante"}</Text><Text style={[styles.aiHint, { color: colors.muted }]}>Perfil</Text></View>
            <AppIcon name="ChevronRight" size={16} color={colors.muted} />
          </Pressable>
        </View>
      </View>
      <View style={styles.main}>
        <View style={[styles.topbar, { borderBottomColor: colors.border }]}>
          <View><Text style={[styles.topEyebrow, { color: colors.muted }]}>{eyebrow}</Text><Text style={[styles.topTitle, { color: colors.foreground }]}>{title}</Text></View>
          <View style={styles.topActions}><View style={[styles.livePill, { borderColor: colors.border, backgroundColor: colors.surface }]}><View style={[styles.liveDot, { backgroundColor: colors.success }]} /><Text style={[styles.liveText, { color: colors.foregroundMuted }]}>Dados locais sincronizados</Text></View><Pressable onPress={() => router.push("/settings" as never)} style={[styles.settings, { backgroundColor: colors.surface, borderColor: colors.border }]}><AppIcon name="Settings" size={18} color={colors.muted} /></Pressable></View>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: "100vh" as any, flexDirection: "row", position: "relative" },
  ambientGlow: { position: "absolute", width: 720, height: 420, top: -180, right: -140, borderRadius: 360, backgroundColor: "rgba(140,200,255,0.07)" },
  sidebar: { width: 244, minHeight: "100vh" as any, borderRightWidth: 1, paddingHorizontal: 18, paddingTop: 28, paddingBottom: 20, zIndex: 3 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", gap: 3, paddingHorizontal: 7 },
  brandMarkLine: { height: 3, backgroundColor: "#08111F", borderRadius: 3 },
  brandName: { fontSize: 23, fontWeight: "900", letterSpacing: 5 },
  sideIntro: { paddingVertical: 36, gap: 10 },
  sideLabel: { fontSize: 10, fontFamily: typography.family.mono, letterSpacing: 2, fontWeight: "800" },
  sideCopy: { fontSize: 13, lineHeight: 19, maxWidth: 180 },
  navList: { gap: 5 },
  navLabel: { fontSize: 10, fontFamily: typography.family.mono, letterSpacing: 1.5, marginBottom: 7 },
  navItem: { minHeight: 44, borderRadius: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  navText: { fontSize: 13, fontWeight: "700" },
  sideBottom: { marginTop: "auto", borderTopWidth: 1, paddingTop: 18, gap: 18 },
  aiLink: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  aiCopy: { flex: 1, gap: 2 },
  aiTitle: { fontSize: 12, fontWeight: "800" },
  aiHint: { fontSize: 11 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#08111F", fontWeight: "900", fontSize: 13 },
  profileName: { fontSize: 12, fontWeight: "800" },
  main: { flex: 1, minWidth: 0 },
  topbar: { minHeight: 104, paddingHorizontal: 48, paddingVertical: 22, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 24 },
  topEyebrow: { fontFamily: typography.family.mono, fontSize: 10, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 8 },
  topTitle: { fontSize: 25, fontWeight: "900", letterSpacing: -0.7 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  livePill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 7, height: 7, borderRadius: 7 },
  liveText: { fontSize: 11, fontWeight: "700" },
  settings: { width: 38, height: 38, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, paddingHorizontal: 48, paddingVertical: 38, maxWidth: 1420 as any, width: "100%" as any },
});
