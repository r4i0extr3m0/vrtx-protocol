import { Platform } from "react-native";
import { PrescribeWorkoutScreen } from "@/src/screens/PrescribeWorkoutScreen";
import { WebPrescribeWorkoutScreen } from "@/src/screens/web/WebPrescribeWorkoutScreen";

export default function PrescribeWorkoutRoute() {
  return Platform.OS === "web" ? <WebPrescribeWorkoutScreen /> : <PrescribeWorkoutScreen />;
}
