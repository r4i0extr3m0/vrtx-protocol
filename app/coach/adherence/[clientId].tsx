import { Platform } from "react-native";
import { CoachAdherenceScreen } from "@/src/screens/CoachAdherenceScreen";
import { WebCoachAdherenceScreen } from "@/src/screens/web/WebCoachAdherenceScreen";

export default function CoachAdherenceRoute() {
  return Platform.OS === "web" ? <WebCoachAdherenceScreen /> : <CoachAdherenceScreen />;
}
