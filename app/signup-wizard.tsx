import { Platform } from "react-native";
import { SignupWizardScreen } from "@/src/screens";
import { WebSignupWizardScreen } from "@/src/screens/web/WebSignupWizardScreen";

export default function SignupWizard() {
  return Platform.OS === "web" ? <WebSignupWizardScreen /> : <SignupWizardScreen />;
}
