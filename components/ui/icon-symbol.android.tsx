import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconSymbolName = "house.fill" | "dumbbell.fill" | "clock.fill" | "chart.bar.fill" | "paperplane.fill" | "chevron.left.forwardslash.chevron.right" | "chevron.right" | "arrow.trianglehead.clockwise" | "gearshape.fill";

const MAPPING: Record<IconSymbolName, string> = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "dumbbell.fill": "fitness-center",
  "clock.fill": "history",
  "chart.bar.fill": "bar-chart",
  "arrow.trianglehead.clockwise": "sync",
  "gearshape.fill": "settings",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: string;
}) {
  const mappedName = MAPPING[name];
  console.log("[IconSymbol] Rendering icon:", name, "→", mappedName, "color:", color, "size:", size);
  return <MaterialIcons color={color} size={size} name={mappedName as any} style={style} />;
}
