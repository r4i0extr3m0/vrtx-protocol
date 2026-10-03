import { Platform } from "react-native";
import { ReportScreen } from "@/src/screens";
import { WebSectionScreen } from "@/src/screens/web/WebSectionScreen";

export default function Report() {
  return Platform.OS === "web" ? <WebSectionScreen variant="reports" /> : <ReportScreen />;
}
