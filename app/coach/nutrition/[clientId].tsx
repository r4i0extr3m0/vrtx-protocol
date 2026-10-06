import { Platform } from "react-native";
import { CoachNutritionScreen } from "@/src/screens/CoachNutritionScreen";
import { WebCoachNutritionScreen } from "@/src/screens/web/WebCoachNutritionScreen";

export default function CoachNutritionRoute() {
  return Platform.OS === "web" ? <WebCoachNutritionScreen /> : <CoachNutritionScreen />;
}
