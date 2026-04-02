import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * SecureStorage
 * - iOS/Android: Expo SecureStore (criptografado pelo SO)
 * - Web: fallback em memória (sem persistência)
 */

const memory = new Map<string, string>();

export const secureStorage = {
  async getString(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return memory.get(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  },

  async setString(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      memory.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") {
      memory.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

