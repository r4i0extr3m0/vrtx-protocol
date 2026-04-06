import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { BlurView } from "@/src/components/BlurView";
import { AppIcon } from "@/src/components/AppIcon";
import { useTheme } from "@/src/hooks";
import { typography } from "@/src/theme";

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  const tabBarHeight = 64 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontFamily: typography.family.body,
          fontSize: 11,
          fontWeight: '700',
          paddingBottom: 4,
          lineHeight: 14,
        },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: 'transparent',
          height: tabBarHeight,
          elevation: 0,
          paddingTop: 6,
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={30} 
            tint="dark" 
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(13, 13, 13, 0.84)' }]} 
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <AppIcon name="Home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Treino",
          tabBarIcon: ({ color }) => <AppIcon name="Zap" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Status",
          tabBarIcon: ({ color }) => <AppIcon name="BarChart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historico",
          tabBarIcon: ({ color }) => <AppIcon name="Clock" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <AppIcon name="User" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
