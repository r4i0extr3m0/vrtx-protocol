import { Platform } from "react-native";
import { AICoachScreen } from "@/src/screens";
import { WebSectionScreen } from "@/src/screens/web/WebSectionScreen";

export default function AICoach() {
  return Platform.OS === "web" ? <WebSectionScreen variant="ai" /> : <AICoachScreen />;
}
