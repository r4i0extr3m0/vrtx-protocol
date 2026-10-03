import { Platform } from "react-native";
import { PremiumScreen } from "@/src/screens";
import { WebSubscriptionScreen } from "@/src/screens/web/WebSubscriptionScreen";

export default function Premium() {
  return Platform.OS === "web" ? <WebSubscriptionScreen /> : <PremiumScreen />;
}
