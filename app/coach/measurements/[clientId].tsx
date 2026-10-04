import { Platform } from "react-native";
import { CoachMeasurementsScreen } from "@/src/screens/CoachMeasurementsScreen";
import { WebShell } from "@/src/screens/web/WebChrome";

export default function CoachMeasurementsRoute() {
  return Platform.OS === "web" ? <WebShell backRoute="/students" eyebrow="Acompanhamento do aluno" title="Medidas corporais"><CoachMeasurementsScreen /></WebShell> : <CoachMeasurementsScreen />;
}
