import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, PanResponder, GestureResponderEvent } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/hooks";
import { spacing, radius, typography } from "@/src/theme";

export interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  unit?: string;
  height?: number;
  color?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function LineChart({ data, title, unit = "", height = 200, color }: LineChartProps) {
  const { colors } = useTheme();
  const chartColor = color || colors.primary;
  const chartWidth = SCREEN_WIDTH - spacing.lg * 2;
  const padding = 20;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const tooltipX = useSharedValue(0);
  const tooltipY = useSharedValue(0);
  const tooltipOpacity = useSharedValue(0);

  const { points } = useMemo(() => {
    if (!data || data.length === 0) return { points: [] };
    
    const values = data.map(d => d.value);
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;
    const range = maxVal - minVal || 1;

    const pts = data.map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2) + padding;
      const y = height - ((d.value - minVal) / range) * (height - padding * 2) - padding;
      return { x, y, value: d.value, label: d.label };
    });

    return { points: pts };
  }, [data, chartWidth, height]);

  const pathData = useMemo(() => {
    if (points.length < 2) return "";
    return points.reduce((acc, p, i) => 
      i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
  }, [points]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt: GestureResponderEvent) => {
      if (data.length < 2) return;
      const touchX = evt.nativeEvent.locationX;
      const index = Math.round(((touchX - padding) / (chartWidth - padding * 2)) * (data.length - 1));
      
      if (index >= 0 && index < data.length) {
        if (index !== activeIndex) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setActiveIndex(index);
          const p = points[index];
          tooltipX.value = p.x;
          tooltipY.value = p.y;
          tooltipOpacity.value = withSpring(1);
        }
      }
    },
    onPanResponderRelease: () => {
      setActiveIndex(null);
      tooltipOpacity.value = withSpring(0);
    }
  }), [activeIndex, chartWidth, data, padding, points, tooltipOpacity, tooltipX, tooltipY]);

  const animatedTooltipStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: tooltipX.value - 40,
    top: tooltipY.value - 60,
    opacity: tooltipOpacity.value,
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    width: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  }));

  if (!data || data.length < 2) {
    return (
      <View style={[styles.empty, { height, backgroundColor: colors.surfaceAlt }]}>
        <Text style={{ color: colors.muted, fontWeight: "600" }}>Dados insuficientes para o gráfico</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {title && <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>}
      <View style={styles.container} {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={height}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={chartColor} stopOpacity="0.3" />
              <Stop offset="1" stopColor={chartColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          
          {/* Área preenchida */}
          <Path
            d={`${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`}
            fill="url(#grad)"
          />
          
          {/* Linha principal */}
          <Path
            d={pathData}
            fill="none"
            stroke={chartColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Círculos nos pontos */}
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={activeIndex === i ? 7 : 4}
              fill={activeIndex === i ? chartColor : colors.background}
              stroke={chartColor}
              strokeWidth="2"
            />
          ))}
        </Svg>

        <Animated.View style={animatedTooltipStyle} pointerEvents="none">
          <Text style={[styles.tooltipValue, { color: colors.foreground }]}>
            {activeIndex !== null ? data[activeIndex].value : 0}{unit}
          </Text>
          <Text style={[styles.tooltipLabel, { color: colors.muted }]}>
            {activeIndex !== null ? data[activeIndex].label : ""}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: spacing.xs,
  },
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    width: "100%",
    borderRadius: radius.xl,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
  },
  tooltipValue: {
    fontSize: 14,
    fontWeight: "900",
  },
  tooltipLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  }
});
