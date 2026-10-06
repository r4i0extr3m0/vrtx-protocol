import { Platform } from "react-native";
import { CoachMeasurementsScreen } from "@/src/screens/CoachMeasurementsScreen";
import { WebCoachMeasurementsScreen } from "@/src/screens/web/WebCoachMeasurementsScreen";

export default function CoachMeasurementsRoute() {
  return Platform.OS === "web" ? <WebCoachMeasurementsScreen /> : <CoachMeasurementsScreen />;
}
