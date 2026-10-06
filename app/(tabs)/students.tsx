import { Platform } from "react-native";
import { CoachStudentsScreen } from "@/src/screens/CoachStudentsScreen";
import { WebCoachDashboardScreen } from "@/src/screens/web/WebCoachDashboardScreen";

export default function StudentsTab() {
  return Platform.OS === "web" ? <WebCoachDashboardScreen /> : <CoachStudentsScreen />;
}
