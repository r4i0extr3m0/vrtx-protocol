import { Platform } from "react-native";
import { AddMealScreen } from "@/src/screens/AddMealScreen";
import { WebAddMealScreen } from "@/src/screens/web/WebAddMealScreen";

export default function AddMealRoute() {
  return Platform.OS === "web" ? <WebAddMealScreen /> : <AddMealScreen />;
}
