export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  foodApiUrl: process.env.EXPO_PUBLIC_FOOD_API_URL ?? "",
  aiApiUrl: process.env.EXPO_PUBLIC_AI_API_URL ?? "http://localhost:8000",
  revenueCatAndroidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "",
  revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "",
  revenueCatEntitlementId: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? "pro",
};

export function getSupabaseEnvError(): string | null {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return "Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env e gere um novo Dev Build.";
  }

  if (env.supabaseAnonKey.startsWith("sb_secret_")) {
    return "EXPO_PUBLIC_SUPABASE_ANON_KEY está usando uma chave secreta do Supabase. Use a chave pública anon para login no app.";
  }

  return null;
}

export function hasSupabaseEnv(): boolean {
  return getSupabaseEnvError() === null;
}
