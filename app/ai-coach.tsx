import { Platform } from "react-native";
import { AICoachScreen } from "@/src/screens";
import { WebAICoachScreen } from "@/src/screens/web/WebAICoachScreen";

export default function AICoach() {
  return Platform.OS === "web" ? <WebAICoachScreen /> : <AICoachScreen />;
}
