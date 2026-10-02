import { Platform } from "react-native";
import { StatisticsScreen } from "@/src/screens/StatisticsScreen";
import { WebSectionScreen } from "@/src/screens/web/WebSectionScreen";

export default function StatisticsRoute() {
  return Platform.OS === "web" ? <WebSectionScreen variant="statistics" /> : <StatisticsScreen />;
}
