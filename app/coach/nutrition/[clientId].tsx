import { Platform } from "react-native";
import { CoachNutritionScreen } from "@/src/screens/CoachNutritionScreen";
import { WebShell } from "@/src/screens/web/WebChrome";

export default function CoachNutritionRoute() {
  return Platform.OS === "web" ? <WebShell backRoute="/students" eyebrow="Acompanhamento do aluno" title="Plano de nutrição"><CoachNutritionScreen /></WebShell> : <CoachNutritionScreen />;
}
