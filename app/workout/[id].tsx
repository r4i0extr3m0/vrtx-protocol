import { Platform } from "react-native";
import { WorkoutScreen } from "@/src/screens/WorkoutScreen";
import { WebWorkoutDetailScreen } from "@/src/screens/web/WebWorkoutDetailScreen";

export default function WorkoutDetailRoute() {
  return Platform.OS === "web" ? <WebWorkoutDetailScreen /> : <WorkoutScreen />;
}
