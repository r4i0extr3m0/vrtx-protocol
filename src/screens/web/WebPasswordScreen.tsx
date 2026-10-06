import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppIcon } from "@/src/components/AppIcon";
import { WebBrand } from "./WebChrome";
import { useAuth, useTheme } from "@/src/hooks";
import { getSupabaseClient } from "@/src/api/supabase";
import { hasSupabaseEnv } from "@/src/constants/env";
import { typography } from "@/src/theme";

type PasswordMode = "forgot" | "reset";
export function WebPasswordScreen({ mode }: { mode: PasswordMode }) {
  const { colors } = useTheme();
  const { resetPassword, updatePassword, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(mode === "reset");
  const [submitted, setSubmitted] = useState(false);
  const [ready, setReady] = useState(mode === "forgot");
  const [error, setError] = useState<string | null>(null);
  const isReset = mode === "reset";
  const copy = useMemo(() => isReset ? { eyebrow: "Segurança", title: "Crie uma nova senha.", description: "Escolha uma senha nova para voltar ao seu ritmo com o VRTX.", action: "Salvar nova senha" } : { eyebrow: "Recuperação", title: "Volte para o seu ritmo.", description: "Informe seu e-mail e enviaremos um link seguro para redefinir sua senha.", action: "Enviar link de redefinição" }, [isReset]);

  useEffect(() => {
    if (!isReset) return;
    let active = true;
    const prepareRecovery = async () => {
      if (!hasSupabaseEnv()) { if (active) { setError("O ambiente de autenticação não está configurado neste preview."); setLoading(false); } return; }
      try {
        const client = getSupabaseClient();
        const current = await client.auth.getSession();
        let session = current.data.session;
        if (!session && typeof window !== "undefined") {
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const code = new URLSearchParams(window.location.search).get("code");
          if (code) {
            const exchanged = await client.auth.exchangeCodeForSession(code);
            session = exchanged.data.session;
            if (exchanged.error) throw exchanged.error;
          } else if (hash.get("access_token") && hash.get("refresh_token")) {
            const restored = await client.auth.setSession({ access_token: hash.get("access_token")!, refresh_token: hash.get("refresh_token")! });
            session = restored.data.session;
            if (restored.error) throw restored.error;
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        }
        if (active) { setReady(Boolean(session)); if (!session) setError("Este link expirou ou já foi utilizado. Solicite um novo link."); }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Não foi possível validar este link.");
      } finally { if (active) setLoading(false); }
    };
    void prepareRecovery();
    return () => { active = false; };
  }, [isReset]);

  const submit = async () => {
    setError(null);
    if (!hasSupabaseEnv()) { setError("O ambiente de autenticação não está configurado neste preview."); return; }
    if (isReset) {
      if (!ready) { setError("Solicite um novo link de redefinição para continuar."); return; }
      if (password.length < 8) { setError("Use uma senha com pelo menos 8 caracteres."); return; }
      if (password !== confirmation) { setError("As senhas não coincidem."); return; }
      setLoading(true);
      const result = await updatePassword(password);
      if (!result.success) { setError(result.message ?? "Não foi possível atualizar a senha."); setLoading(false); return; }
      setSubmitted(true); setLoading(false); await signOut();
      return;
    }
    if (!email.trim()) { setError("Informe seu e-mail para continuar."); return; }
    setLoading(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const result = await resetPassword(email.trim(), redirectTo);
    setLoading(false);
    if (!result.success) { setError(result.message ?? "Não foi possível enviar o link."); return; }
    setSubmitted(true);
  };

  return <View style={[styles.page, { backgroundColor: colors.background }]}><View pointerEvents="none" style={[styles.glow, { backgroundColor: colors.primary + "18" }]} /><View style={styles.topbar}><WebBrand /><Pressable onPress={() => router.replace("/login")}><Text style={[styles.back, { color: colors.foregroundMuted }]}>Voltar para login</Text></Pressable></View><View style={styles.center}><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.iconBox, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "55" }]}><AppIcon name={isReset ? "Lock" : "Mail"} size={24} color={colors.primary} /></View><Text style={[styles.eyebrow, { color: colors.primary }]}>{copy.eyebrow.toUpperCase()}</Text><Text style={[styles.title, { color: colors.foreground }]}>{submitted ? "Tudo certo." : copy.title}</Text><Text style={[styles.description, { color: colors.foregroundMuted }]}>{submitted ? (isReset ? "Sua senha foi atualizada. Agora você pode entrar novamente com segurança." : "Enviamos as instruções para o seu e-mail. Verifique também a pasta de spam.") : copy.description}</Text>{error ? <View style={[styles.errorBox, { backgroundColor: colors.error + "12", borderColor: colors.error + "55" }]}><Text style={[styles.errorText, { color: colors.error }]}>{error}</Text></View> : null}{!submitted && !isReset ? <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@exemplo.com" colors={colors} keyboardType="email-address" /> : null}{!submitted && isReset && ready ? <><Field label="Nova senha" value={password} onChangeText={setPassword} placeholder="Pelo menos 8 caracteres" colors={colors} secureTextEntry /><Field label="Confirme a nova senha" value={confirmation} onChangeText={setConfirmation} placeholder="Digite novamente" colors={colors} secureTextEntry /></> : null}{!submitted && (isReset ? !loading : true) ? <Pressable disabled={loading} onPress={submit} style={[styles.primary, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}><Text style={styles.primaryText}>{loading ? "Validando..." : copy.action}</Text><AppIcon name="ChevronRight" size={16} color="#06111D" /></Pressable> : null}{submitted ? <Pressable onPress={() => router.replace("/login")} style={[styles.primary, { backgroundColor: colors.primary }]}><Text style={styles.primaryText}>Voltar para login</Text><AppIcon name="ChevronRight" size={16} color="#06111D" /></Pressable> : null}<Text style={[styles.footnote, { color: colors.muted }]}>{isReset ? "Por segurança, o link de redefinição funciona por tempo limitado." : "Não compartilhamos seu e-mail e nunca pediremos sua senha por mensagem."}</Text></View></View><Text style={[styles.footer, { color: colors.muted }]}>VRTX Protocol · Treino orientado por clareza</Text></View>;
}
function Field({ label, value, onChangeText, placeholder, colors, secureTextEntry, keyboardType }: any) { return <View style={styles.field}><Text style={[styles.label, { color: colors.foregroundMuted }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize="none" style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /></View>; }
const styles = StyleSheet.create({ page: { flex: 1, minHeight: "100vh" as any, paddingHorizontal: 56, paddingVertical: 30, overflow: "hidden" }, glow: { position: "absolute", width: 620, height: 620, borderRadius: 400, right: -250, top: -240 }, topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, back: { fontSize: 12, fontWeight: "800" }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18 }, card: { width: 440, maxWidth: "100%" as any, borderWidth: 1, borderRadius: 24, padding: 30, gap: 16, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 28, shadowOffset: { width: 0, height: 16 }, elevation: 10 }, iconBox: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" }, eyebrow: { fontFamily: typography.family.mono, fontSize: 10, letterSpacing: 1.7, fontWeight: "800" }, title: { fontSize: 34, lineHeight: 39, fontWeight: "900", letterSpacing: -1.1 }, description: { fontSize: 15, lineHeight: 23 }, field: { gap: 7, marginTop: 3 }, label: { fontSize: 11, fontWeight: "800" }, input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 }, primary: { minHeight: 52, borderRadius: 13, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 5 }, primaryText: { color: "#06111D", fontSize: 13, fontWeight: "900" }, errorBox: { borderWidth: 1, borderRadius: 12, padding: 12 }, errorText: { fontSize: 12, lineHeight: 18, fontWeight: "700" }, footnote: { fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 3 }, footer: { fontFamily: typography.family.mono, fontSize: 10, letterSpacing: 0.7 } });
