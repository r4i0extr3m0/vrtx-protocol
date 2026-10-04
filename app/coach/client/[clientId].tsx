import { Platform } from "react-native";
import { StudentDetailScreen } from "@/src/screens/StudentDetailScreen";
import { WebClientWorkspaceScreen } from "@/src/screens/web/WebClientWorkspaceScreen";

export default function StudentDetailRoute() {
  return Platform.OS === "web" ? <WebClientWorkspaceScreen /> : <StudentDetailScreen />;
}
