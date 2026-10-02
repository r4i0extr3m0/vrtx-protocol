import { Platform } from "react-native";
import { ForgotPasswordScreen } from "@/src/screens";
import { WebPasswordScreen } from "@/src/screens/web/WebPasswordScreen";

export default function ForgotPassword() {
  return Platform.OS === "web" ? <WebPasswordScreen mode="forgot" /> : <ForgotPasswordScreen />;
}
