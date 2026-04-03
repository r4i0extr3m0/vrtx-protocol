import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

import type { BodyCompositionSegments } from "@/src/types";
import { useTheme } from "@/src/hooks";
import { spacing, typography } from "@/src/theme";

type SegmentKey = keyof Required<BodyCompositionSegments>;

interface Props {
  title?: string;
  segments?: BodyCompositionSegments;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function withAlpha(hex: string, alpha: number): string {
  // hex: #RRGGBB
  const a = Math.round(clamp01(alpha) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export function BodyCompositionFigure({ title = "Equilíbrio da massa muscular", segments }: Props) {
  const { colors } = useTheme();

  const normalized = useMemo(() => {
    const values: Record<SegmentKey, number> = {
      leftArmKg: segments?.leftArmKg ?? 0,
      rightArmKg: segments?.rightArmKg ?? 0,
      leftLegKg: segments?.leftLegKg ?? 0,
      rightLegKg: segments?.rightLegKg ?? 0,
      trunkKg: segments?.trunkKg ?? 0,
    };

    const max = Math.max(...Object.values(values), 0.0001);
    const ratio = (v: number) => clamp01(v / max);

    return {
      values,
      fill: (key: SegmentKey) => {
        const base = colors.primary;
        const r = ratio(values[key]);
        // corpo estilo “bioimpedância”: azul claro quando baixo, mais forte quando alto
        return withAlpha(base, 0.25 + r * 0.65);
      },
      stroke: colors.border,
    };
  }, [colors.border, colors.primary, segments]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>

      <View style={styles.bodyRow}>
        <View style={styles.labelColumn}>
          <Text style={[styles.label, { color: colors.muted }]}>Braço esquerdo</Text>
          <Text style={[styles.label, { color: colors.muted, marginTop: 58 }]}>Perna esquerda</Text>
        </View>

        <Svg width={150} height={200} viewBox="0 0 150 200">
          <G>
            {/* Cabeça */}
            <Circle cx="75" cy="18" r="10" fill={normalized.fill("trunkKg")} stroke={normalized.stroke} />

            {/* Tronco */}
            <Path
              d="M60 30 C60 30, 55 55, 55 80 C55 105, 60 125, 75 125 C90 125, 95 105, 95 80 C95 55, 90 30, 90 30 Z"
              fill={normalized.fill("trunkKg")}
              stroke={normalized.stroke}
              strokeWidth="1"
            />

            {/* Braço esquerdo */}
            <Path
              d="M55 45 C40 55, 28 70, 20 85 C17 90, 20 96, 26 94 C34 92, 44 80, 54 70 Z"
              fill={normalized.fill("leftArmKg")}
              stroke={normalized.stroke}
              strokeWidth="1"
            />
            {/* Braço direito */}
            <Path
              d="M95 45 C110 55, 122 70, 130 85 C133 90, 130 96, 124 94 C116 92, 106 80, 96 70 Z"
              fill={normalized.fill("rightArmKg")}
              stroke={normalized.stroke}
              strokeWidth="1"
            />

            {/* Perna esquerda */}
            <Path
              d="M68 125 C58 140, 52 162, 48 185 C47 192, 55 196, 60 190 C70 178, 72 150, 78 130 Z"
              fill={normalized.fill("leftLegKg")}
              stroke={normalized.stroke}
              strokeWidth="1"
            />
            {/* Perna direita */}
            <Path
              d="M82 125 C92 140, 98 162, 102 185 C103 192, 95 196, 90 190 C80 178, 78 150, 72 130 Z"
              fill={normalized.fill("rightLegKg")}
              stroke={normalized.stroke}
              strokeWidth="1"
            />
          </G>
        </Svg>

        <View style={styles.labelColumn}>
          <Text style={[styles.label, { color: colors.muted }]}>Braço direito</Text>
          <Text style={[styles.label, { color: colors.muted, marginTop: 58 }]}>Perna direita</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.body,
    fontWeight: "900",
    textAlign: "center",
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  labelColumn: {
    width: 92,
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});

