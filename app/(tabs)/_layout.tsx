import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { BlurView } from "@/src/components/BlurView";
import { AppIcon } from "@/src/components/AppIcon";
import { useAuth, useTheme } from "@/src/hooks";
import { useI18n } from "@/src/i18n";
import { getTabBarHeight } from "@/src/navigation/tabBar";
import { typography } from "@/src/theme";

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets);
  const { user } = useAuth();
  const { t } = useI18n();
  const isCoach = user?.role === "coach";

  return (
    <Tabs
      screenOptions={{
        tabBarPosition: Platform.OS === "web" ? "left" : "bottom",
        sceneStyle: Platform.OS === "web" ? { marginLeft: 248 } : undefined,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontFamily: typography.family.body,
          fontSize: Platform.OS === "web" ? 13 : 11,
          fontWeight: '700',
          paddingBottom: Platform.OS === "web" ? 0 : 4,
          lineHeight: 14,
          ...(Platform.OS === "web" ? { textAlign: "left", flex: 1 } : {}),
        },
        tabBarStyle: {
          position: Platform.OS === "web" ? "fixed" : "absolute",
          borderTopColor: colors.border,
          borderRightWidth: Platform.OS === "web" ? 1 : 0,
          borderRightColor: colors.border,
          borderTopWidth: Platform.OS === "web" ? 0 : 1,
          backgroundColor: Platform.OS === "web" ? colors.surface : 'transparent',
          width: Platform.OS === "web" ? 248 : undefined,
          height: Platform.OS === "web" ? "100%" : tabBarHeight,
          elevation: 0,
          paddingTop: Platform.OS === "web" ? 92 : 6,
          paddingBottom: Platform.OS === "web" ? 24 : 0,
          paddingHorizontal: Platform.OS === "web" ? 12 : 0,
        },
        tabBarItemStyle: Platform.OS === "web" ? {
          width: "100%",
          height: 48,
          borderRadius: 12,
          paddingHorizontal: 14,
          marginVertical: 4,
          flexDirection: "row",
          justifyContent: "flex-start",
        } : undefined,
        tabBarBackground: () => Platform.OS === "web" ? null : (
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
      {isCoach ? (
        <Tabs.Screen
          name="students"
          options={{
            title: t("coach.tabLabel"),
            tabBarIcon: ({ color }) => <AppIcon name="Users" size={24} color={color} />,
          }}
        />
      ) : null}
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
        name="diet"
        options={{
          title: "Dieta",
          tabBarIcon: ({ color }) => <AppIcon name="Apple" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <AppIcon name="User" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
