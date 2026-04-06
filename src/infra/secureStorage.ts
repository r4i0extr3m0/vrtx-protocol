import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * SecureStorage
 * - iOS/Android: Expo SecureStore (criptografado pelo SO)
 * - Web: fallback em memória (sem persistência)
 */

const memory = new Map<string, string>();
const isNativeMobile = Platform.OS === "ios" || Platform.OS === "android";

export const secureStorage = {
  async getString(key: string): Promise<string | null> {
    if (!isNativeMobile) {
      return memory.get(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  },

  async setString(key: string, value: string): Promise<void> {
    if (!isNativeMobile) {
      memory.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async remove(key: string): Promise<void> {
    if (!isNativeMobile) {
      memory.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

