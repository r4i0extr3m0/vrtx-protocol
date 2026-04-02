import { StyleSheet, Text, View } from "react-native";

import { useSync, useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";

export function SyncStatusPill() {
  const { colors } = useTheme();
  const { pendingCount, networkReachable, isProcessing } = useSync();

  const statusLabel = isProcessing
    ? "Sincronizando"
    : pendingCount > 0
      ? `${pendingCount} pendência${pendingCount > 1 ? "s" : ""}`
      : networkReachable
        ? "Em dia"
        : "Offline";

  const backgroundColor = isProcessing
    ? colors.primaryStrong
    : pendingCount > 0
      ? colors.warning
      : networkReachable
        ? colors.success
        : colors.surfaceAlt;

  const foreground = pendingCount > 0 || isProcessing ? colors.background : colors.foreground;

  return (
    <View style={[styles.pill, { backgroundColor }]}> 
      <Text style={[styles.label, { color: foreground }]}>{statusLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
