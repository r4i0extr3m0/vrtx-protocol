import Constants from "expo-constants";
import { Platform } from "react-native";

type StorageLike = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  remove: (key: string) => void;
  getAllKeys: () => string[];
};

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();

  return {
    getString: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
    },
    remove: (key) => {
      map.delete(key);
    },
    getAllKeys: () => [...map.keys()],
  };
}

function shouldUseMemoryStorage(): boolean {
  if (Platform.OS === "web" || typeof window === "undefined") return true;
  // react-native-mmkv v4 uses JSI which crashes in Expo Go (storeClient)
  // JSI errors cannot be caught by JavaScript try-catch
  if (Constants.executionEnvironment === "storeClient") return true;
  // Use memory storage for now to avoid JSI issues in release builds
  // TODO: Investigate JSI initialization in release APK
  return true;
}

function createNativeMMKVStorage(): StorageLike {
  try {
    const { MMKV } = require("react-native-mmkv");
    const encryptionKey = "ironlog-secure-key-2026";
    const mmkvInstance = new MMKV({
      id: "ironlog-storage",
      encryptionKey: encryptionKey,
    });
    return mmkvInstance;
  } catch (error) {
    console.error("Erro ao criar MMKV nativo, usando memory storage como fallback:", error);
    return createMemoryStorage();
  }
}

export const storage: StorageLike = shouldUseMemoryStorage()
  ? createMemoryStorage()
  : createNativeMMKVStorage();

export function initializeMMKV(): void {
  try {
    storage.getAllKeys();
  } catch (e) {
    console.error("Erro ao inicializar MMKV criptografado:", e);
  }
}

export const mmkvJsonStorage = {
  getItem: (name: string): string | null => storage.getString(name) ?? null,
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};
