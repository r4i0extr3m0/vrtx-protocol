import { Platform } from "react-native";
import { GoalsScreen } from "@/src/screens/GoalsScreen";
import { WebGoalsScreen } from "@/src/screens/web/WebGoalsScreen";

export default function GoalsRoute() {
  return Platform.OS === "web" ? <WebGoalsScreen /> : <GoalsScreen />;
}
