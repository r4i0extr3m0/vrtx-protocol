import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { useI18n } from "@/src/i18n";
import { useTheme } from "@/src/hooks";
import { radius, spacing, typography } from "@/src/theme";

interface Props {
  weightKg?: number | null;
  bodyFatPct?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  calfCm?: number | null;
}

const BODY_HALF =
  "M160 50 L152 54 C144 64 132 74 120 84 C108 104 100 138 96 178 C93 216 94 246 97 274 " +
  "C99 288 110 290 113 279 C116 254 114 222 116 190 C119 150 127 114 137 98 C139 94 140 92 140 92 " +
  "C135 110 133 140 134 166 C135 188 138 202 141 214 C143 226 139 240 134 252 " +
  "C127 274 123 298 122 328 C121 356 123 378 124 396 C125 410 123 420 124 428 L124 442 " +
  "C124 448 132 450 140 447 C146 445 148 436 147 426 C145 404 148 362 152 331 " +
  "C155 311 158 297 160 291 Z";

function has(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

function format(value: number | null | undefined, unit: string): string {
  if (!has(value)) return "—";
  return `${value}${unit}`;
}

export function MeasurementBodyFigure({
  weightKg,
  bodyFatPct,
  chestCm,
  waistCm,
  hipCm,
  armCm,
  thighCm,
  calfCm,
}: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const anyValue =
    has(chestCm) || has(waistCm) || has(hipCm) || has(armCm) || has(thighCm) || has(calfCm);
  const bodyFill = anyValue ? withAlpha(colors.primary, 0.18) : colors.surfaceAlt;
  const bodyStroke = anyValue ? withAlpha(colors.primary, 0.55) : colors.border;
  const armActive = has(armCm);
  const thighActive = has(thighCm);
  const calfActive = has(calfCm);

  const centerLabel = (y: number, name: string, value: string, active: boolean) => (
    <G key={name}>
      <Rect
        x={118}
        y={y - 16}
        width={84}
        height={32}
        rx={10}
        fill={colors.surfaceAlt}
        stroke={active ? withAlpha(colors.primary, 0.6) : colors.border}
        strokeWidth={1}
      />
      <SvgText x={160} y={y - 3} textAnchor="middle" fill={colors.muted} fontSize={9} fontWeight="700">
        {name}
      </SvgText>
      <SvgText x={160} y={y + 11} textAnchor="middle" fill={colors.foreground} fontSize={13} fontWeight="800">
        {value}
      </SvgText>
    </G>
  );

  const sideMarker = (
    side: "left" | "right",
    y: number,
    outerX: number,
    name: string,
    value: string,
    active: boolean,
  ) => {
    const isLeft = side === "left";
    const edgeX = isLeft ? outerX : 320 - outerX;
    const markerX = isLeft ? outerX + 6 : 320 - outerX - 6;
    const lineEnd = isLeft ? outerX - 18 : 320 - outerX + 18;
    const textX = isLeft ? outerX - 22 : 320 - outerX + 22;
    const anchor = isLeft ? "end" : "start";
    return (
      <G key={`${side}-${name}-${y}`}>
        <Line
          x1={edgeX}
          y1={y}
          x2={lineEnd}
          y2={y}
          stroke={active ? withAlpha(colors.primary, 0.5) : colors.border}
          strokeWidth={1}
        />
        <Circle
          cx={markerX}
          cy={y}
          r={4}
          fill={active ? colors.primary : colors.muted}
          stroke={colors.surface}
          strokeWidth={1.5}
        />
        <SvgText x={textX} y={y - 4} textAnchor={anchor} fill={colors.muted} fontSize={9} fontWeight="700">
          {name}
        </SvgText>
        <SvgText x={textX} y={y + 11} textAnchor={anchor} fill={colors.foreground} fontSize={13} fontWeight="800">
          {value}
        </SvgText>
      </G>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {t("measurements.bodyTitle")}
      </Text>

      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[styles.badgeLabel, { color: colors.muted }]}>{t("measurements.weight")}</Text>
          <Text style={[styles.badgeValue, { color: colors.foreground }]}>
            {format(weightKg, " kg")}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[styles.badgeLabel, { color: colors.muted }]}>{t("measurements.bodyFat")}</Text>
          <Text style={[styles.badgeValue, { color: colors.foreground }]}>
            {format(bodyFatPct, "%")}
          </Text>
        </View>
      </View>

      <Svg width="100%" height={420} viewBox="0 0 320 460">
        {/* Silhueta */}
        <G fill={bodyFill} stroke={bodyStroke} strokeWidth={1}>
          <Path d={BODY_HALF} />
          <Path d={BODY_HALF} transform="translate(320,0) scale(-1,1)" />
          <Circle cx={160} cy={30} r={21} />
        </G>

        {/* Marcadores e rotulos dos membros */}
        {sideMarker("left", 176, 96, t("measurements.arm"), format(armCm, " cm"), armActive)}
        {sideMarker("right", 176, 96, t("measurements.arm"), format(armCm, " cm"), armActive)}
        {sideMarker("left", 300, 122, t("measurements.thigh"), format(thighCm, " cm"), thighActive)}
        {sideMarker("right", 300, 122, t("measurements.thigh"), format(thighCm, " cm"), thighActive)}
        {sideMarker("left", 392, 124, t("measurements.calf"), format(calfCm, " cm"), calfActive)}
        {sideMarker("right", 392, 124, t("measurements.calf"), format(calfCm, " cm"), calfActive)}

        {/* Rotulos tronco */}
        {centerLabel(118, t("measurements.chest"), format(chestCm, " cm"), has(chestCm))}
        {centerLabel(208, t("measurements.waist"), format(waistCm, " cm"), has(waistCm))}
        {centerLabel(246, t("measurements.hip"), format(hipCm, " cm"), has(hipCm))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  title: {
    fontSize: typography.body,
    fontWeight: "900",
    textAlign: "center",
  },
  badges: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  badge: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    gap: 2,
  },
  badgeLabel: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  badgeValue: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
});
