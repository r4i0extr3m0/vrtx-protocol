export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  foodApiUrl: process.env.EXPO_PUBLIC_FOOD_API_URL ?? "",
  aiApiUrl: process.env.EXPO_PUBLIC_AI_API_URL ?? "http://localhost:8000",
};

export function hasSupabaseEnv(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
