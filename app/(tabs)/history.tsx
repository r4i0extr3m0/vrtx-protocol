import { Platform } from "react-native";
import { HistoryScreen } from "@/src/screens/HistoryScreen";
import { WebSectionScreen } from "@/src/screens/web/WebSectionScreen";

export default function HistoryRoute() {
  return Platform.OS === "web" ? <WebSectionScreen variant="history" /> : <HistoryScreen />;
}
