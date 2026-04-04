import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

import { HapticTab } from "@/components/haptic-tab";
import { AppIcon } from "@/src/components/AppIcon";
import { useTheme } from "@/src/hooks";
import { typography } from "@/src/theme";

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 64 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontFamily: typography.family.mono,
          fontSize: 10,
          fontWeight: '700',
          paddingBottom: 4,
        },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          backgroundColor: 'transparent',
          height: tabBarHeight,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={30} 
            tint="dark" 
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(13, 13, 13, 0.8)' }]} 
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "COMMAND",
          tabBarIcon: ({ color }) => <AppIcon name="Cpu" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "PROTOCOLO",
          tabBarIcon: ({ color }) => <AppIcon name="Zap" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "LOGS",
          tabBarIcon: ({ color }) => <AppIcon name="Database" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "ANALYTICS",
          tabBarIcon: ({ color }) => <AppIcon name="Activity" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
