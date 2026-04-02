import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/src/hooks";
import { spacing, typography } from "@/src/theme";

export interface BarDataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDataPoint[];
  title?: string;
  unit?: string;
  height?: number;
  color?: string;
}

export function BarChart({ data, title, unit = "", height = 160, color }: BarChartProps) {
  const { colors } = useTheme();
  const barColor = color ?? colors.primary;

  const width = 300;
  const paddingH = 40;
  const paddingV = 20;
  const chartWidth = width - paddingH * 2;
  const chartHeight = height - paddingV * 2;

  const { bars, maxVal } = useMemo(() => {
    if (data.length === 0) return { bars: [], maxVal: 0 };
    const max = Math.max(...data.map((d) => d.value)) || 1;
    const barWidth = chartWidth / data.length;
    const gap = barWidth * 0.2;
    const bw = barWidth - gap;
    const bs = data.map((d, i) => {
      const barH = (d.value / max) * chartHeight;
      const x = paddingH + i * barWidth + gap / 2;
      const y = paddingV + chartHeight - barH;
      return { x, y, width: bw, height: barH, label: d.label, value: d.value };
    });
    return { bars: bs, maxVal: max };
  }, [data, chartWidth, chartHeight]);

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.muted }]}>Sem dados suficientes</Text>
      </View>
    );
  }

  return (
    <View>
      {title ? <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text> : null}
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Axis */}
        <Line x1={paddingH} y1={paddingV} x2={paddingH} y2={paddingV + chartHeight} stroke={colors.border} strokeWidth={1} />
        <Line x1={paddingH} y1={paddingV + chartHeight} x2={paddingH + chartWidth} y2={paddingV + chartHeight} stroke={colors.border} strokeWidth={1} />

        {/* Y label */}
        <SvgText x={paddingH - 4} y={paddingV + 4} fill={colors.muted} fontSize={9} textAnchor="end">
          {maxVal.toFixed(0)}{unit}
        </SvgText>

        {/* Bars */}
        {bars.map((b, i) => (
          <Rect key={i} x={b.x} y={b.y} width={b.width} height={b.height} fill={barColor} rx={3} />
        ))}

        {/* X labels */}
        {bars.map((b, i) => (
          <SvgText key={i} x={b.x + b.width / 2} y={paddingV + chartHeight + 14} fill={colors.muted} fontSize={9} textAnchor="middle">
            {b.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  empty: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: typography.caption,
  },
});
