import { Platform } from "react-native";
import { ProfileScreen } from "@/src/screens/ProfileScreen";
import { WebSectionScreen } from "@/src/screens/web/WebSectionScreen";

export default function ProfileRoute() {
  return Platform.OS === "web" ? <WebSectionScreen variant="profile" /> : <ProfileScreen />;
}
