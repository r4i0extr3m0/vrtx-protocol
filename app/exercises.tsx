import { Platform } from "react-native";
import { ExercisesScreen } from "@/src/screens/ExercisesScreen";
import { WebSectionScreen } from "@/src/screens/web/WebSectionScreen";

export default function ExercisesPage() {
  return Platform.OS === "web" ? <WebSectionScreen variant="exercises" /> : <ExercisesScreen />;
}
