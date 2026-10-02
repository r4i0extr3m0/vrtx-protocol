import { Platform } from "react-native";
import { PremiumScreen } from "@/src/screens";
import { WebSectionScreen } from "@/src/screens/web/WebSectionScreen";

export default function Premium() {
  return Platform.OS === "web" ? <WebSectionScreen variant="premium" /> : <PremiumScreen />;
}
