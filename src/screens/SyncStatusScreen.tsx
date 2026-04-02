import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/src/components/AppButton";
import { useSync, useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";

export function SyncStatusScreen() {
  const { colors } = useTheme();
  const { queue, processPending, networkReachable, lastError, lastSyncedAt } = useSync();

  return (
    <ScreenContainer className="px-5 py-5" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Status de sincronização</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>A fila é processada em ordem FIFO e tenta novamente automaticamente quando a rede volta.</Text>
        </View>

        <View style={[styles.statusBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.statusLine, { color: colors.foreground }]}>Rede: {networkReachable ? "disponível" : "offline"}</Text>
          <Text style={[styles.statusLine, { color: colors.foreground }]}>Pendências: {queue.length}</Text>
          <Text style={[styles.statusLine, { color: colors.foreground }]}>Última sincronização: {lastSyncedAt ?? "ainda não executada"}</Text>
          <Text style={[styles.statusLine, { color: colors.warning }]}>Último erro: {lastError ?? "nenhum"}</Text>
        </View>

        <AppButton label="Tentar sincronizar agora" onPress={() => { void processPending(); }} />

        {queue.map((operation) => (
          <View key={operation.id} style={[styles.queueItem, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}> 
            <Text style={[styles.queueTitle, { color: colors.foreground }]}>{operation.type.toUpperCase()} · {operation.table}</Text>
            <Text style={[styles.queueMeta, { color: colors.muted }]}>Retries: {operation.retries} · Timestamp: {new Date(operation.timestamp).toLocaleString("pt-BR")}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  statusBox: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusLine: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  queueItem: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  queueTitle: {
    fontSize: typography.body,
    fontWeight: "800",
  },
  queueMeta: {
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
