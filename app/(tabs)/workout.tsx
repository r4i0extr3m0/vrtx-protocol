import { Platform } from "react-native";
import { WorkoutScreen } from "@/src/screens/WorkoutScreen";
import { WebSectionScreen } from "@/src/screens/web/WebSectionScreen";

export default function WorkoutRoute() {
  return Platform.OS === "web" ? <WebSectionScreen variant="workout" /> : <WorkoutScreen />;
}
