import { Platform } from "react-native";
import { CoachAdherenceScreen } from "@/src/screens/CoachAdherenceScreen";
import { WebShell } from "@/src/screens/web/WebChrome";

export default function CoachAdherenceRoute() {
  return Platform.OS === "web" ? <WebShell backRoute="/students" eyebrow="Acompanhamento do aluno" title="Aderência"><CoachAdherenceScreen /></WebShell> : <CoachAdherenceScreen />;
}
