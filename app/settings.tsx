import { Platform } from "react-native";
import { SettingsScreen } from "@/src/screens/SettingsScreen";
import { WebSectionScreen } from "@/src/screens/web/WebSectionScreen";

export default function SettingsRoute() {
  return Platform.OS === "web" ? <WebSectionScreen variant="settings" /> : <SettingsScreen />;
}
