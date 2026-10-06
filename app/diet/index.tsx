import { Platform } from "react-native";
import { DietLogScreen } from "@/src/screens/DietLogScreen";
import { WebSectionScreen } from "@/src/screens/web/WebSectionScreen";

export default function DietLogRoute() {
  return Platform.OS === "web" ? <WebSectionScreen variant="diet" /> : <DietLogScreen />;
}
