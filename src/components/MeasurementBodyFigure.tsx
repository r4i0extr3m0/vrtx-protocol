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

  const armFill = has(armCm) ? withAlpha(colors.primary, 0.55) : colors.surfaceAlt;
  const trunkFill = has(chestCm) || has(waistCm) || has(hipCm)
    ? withAlpha(colors.primary, 0.5)
    : colors.surfaceAlt;
  const legFill = has(thighCm) || has(calfCm) ? withAlpha(colors.primary, 0.5) : colors.surfaceAlt;
  const stroke = colors.border;

  const centerLabel = (
    y: number,
    name: string,
    value: string,
  ) => (
    <G key={name}>
      <Rect
        x={118}
        y={y - 16}
        width={84}
        height={32}
        rx={10}
        fill={colors.surfaceAlt}
        stroke={stroke}
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

      <Svg width="100%" height={400} viewBox="0 0 320 420">
        {/* Corpo */}
        <G>
          <Circle cx={160} cy={40} r={16} fill={trunkFill} stroke={stroke} strokeWidth={1} />
          <Path
            d="M128 66 C124 110, 124 170, 132 220 C136 244, 148 252, 160 252 C172 252, 184 244, 188 220 C196 170, 196 110, 192 66 Z"
            fill={trunkFill}
            stroke={stroke}
            strokeWidth={1}
          />
          <Path
            d="M132 72 C112 90, 96 130, 92 175 C90 190, 100 194, 106 182 C116 158, 126 120, 132 92 Z"
            fill={armFill}
            stroke={stroke}
            strokeWidth={1}
          />
          <Path
            d="M188 72 C208 90, 224 130, 228 175 C230 190, 220 194, 214 182 C204 158, 194 120, 188 92 Z"
            fill={armFill}
            stroke={stroke}
            strokeWidth={1}
          />
          <Path
            d="M150 250 C138 280, 130 330, 128 380 C127 396, 140 400, 146 388 C154 360, 158 300, 160 260 Z"
            fill={legFill}
            stroke={stroke}
            strokeWidth={1}
          />
          <Path
            d="M170 250 C182 280, 190 330, 192 380 C193 396, 180 400, 174 388 C166 360, 162 300, 160 260 Z"
            fill={legFill}
            stroke={stroke}
            strokeWidth={1}
          />
        </G>

        {/* Conectores dos membros */}
        <Line x1={92} y1={150} x2={128} y2={140} stroke={stroke} strokeWidth={1} />
        <Line x1={228} y1={150} x2={192} y2={140} stroke={stroke} strokeWidth={1} />
        <Line x1={128} y1={318} x2={150} y2={300} stroke={stroke} strokeWidth={1} />
        <Line x1={192} y1={318} x2={170} y2={300} stroke={stroke} strokeWidth={1} />
        <Line x1={128} y1={390} x2={146} y2={378} stroke={stroke} strokeWidth={1} />
        <Line x1={192} y1={390} x2={174} y2={378} stroke={stroke} strokeWidth={1} />

        {/* Rotulos membros */}
        <SvgText x={84} y={144} textAnchor="end" fill={colors.muted} fontSize={9} fontWeight="700">
          {t("measurements.arm")}
        </SvgText>
        <SvgText x={84} y={158} textAnchor="end" fill={colors.foreground} fontSize={13} fontWeight="800">
          {format(armCm, " cm")}
        </SvgText>

        <SvgText x={236} y={144} textAnchor="start" fill={colors.muted} fontSize={9} fontWeight="700">
          {t("measurements.arm")}
        </SvgText>
        <SvgText x={236} y={158} textAnchor="start" fill={colors.foreground} fontSize={13} fontWeight="800">
          {format(armCm, " cm")}
        </SvgText>

        <SvgText x={120} y={312} textAnchor="end" fill={colors.muted} fontSize={9} fontWeight="700">
          {t("measurements.thigh")}
        </SvgText>
        <SvgText x={120} y={326} textAnchor="end" fill={colors.foreground} fontSize={13} fontWeight="800">
          {format(thighCm, " cm")}
        </SvgText>

        <SvgText x={200} y={312} textAnchor="start" fill={colors.muted} fontSize={9} fontWeight="700">
          {t("measurements.thigh")}
        </SvgText>
        <SvgText x={200} y={326} textAnchor="start" fill={colors.foreground} fontSize={13} fontWeight="800">
          {format(thighCm, " cm")}
        </SvgText>

        <SvgText x={120} y={384} textAnchor="end" fill={colors.muted} fontSize={9} fontWeight="700">
          {t("measurements.calf")}
        </SvgText>
        <SvgText x={120} y={398} textAnchor="end" fill={colors.foreground} fontSize={13} fontWeight="800">
          {format(calfCm, " cm")}
        </SvgText>

        <SvgText x={200} y={384} textAnchor="start" fill={colors.muted} fontSize={9} fontWeight="700">
          {t("measurements.calf")}
        </SvgText>
        <SvgText x={200} y={398} textAnchor="start" fill={colors.foreground} fontSize={13} fontWeight="800">
          {format(calfCm, " cm")}
        </SvgText>

        {/* Rotulos tronco */}
        {centerLabel(118, t("measurements.chest"), format(chestCm, " cm"))}
        {centerLabel(196, t("measurements.waist"), format(waistCm, " cm"))}
        {centerLabel(244, t("measurements.hip"), format(hipCm, " cm"))}
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
