import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => {
            console.log("[Tab] Home icon - focused:", focused, "color:", color);
            return <IconSymbol size={28} name="house.fill" color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Treino",
          tabBarIcon: ({ color, focused }) => {
            console.log("[Tab] Workout icon - focused:", focused, "color:", color);
            return <IconSymbol size={28} name="dumbbell.fill" color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color, focused }) => {
            console.log("[Tab] History icon - focused:", focused, "color:", color);
            return <IconSymbol size={28} name="clock.fill" color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, focused }) => {
            console.log("[Tab] Stats icon - focused:", focused, "color:", color);
            return <IconSymbol size={28} name="chart.bar.fill" color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
