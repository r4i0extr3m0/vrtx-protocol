import { Platform } from "react-native";
import { WorkoutScreen } from "@/src/screens/WorkoutScreen";
import { WebWorkoutBuilderScreen } from "@/src/screens/web/WebWorkoutBuilderScreen";

export default function WorkoutBuilderRoute() {
  return Platform.OS === "web" ? <WebWorkoutBuilderScreen /> : <WorkoutScreen />;
}
