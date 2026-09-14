import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { storage } from "@/src/infra/mmkv";
import i18n from "@/src/i18n";
import type { CoachPrescription } from "@/src/types";

const SEEN_KEY = "vrtxprotocol.prescriptions.seen";
const CHANNEL_ID = "prescriptions";

let handlerConfigured = false;

function configureHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn("[notifications] handler setup failed", error);
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Treinos prescritos",
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch (error) {
    console.warn("[notifications] channel setup failed", error);
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === "granted") return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === "granted";
  } catch (error) {
    console.warn("[notifications] permission request failed", error);
    return false;
  }
}

function readSeenIds(): string[] {
  const raw = storage.getString(SEEN_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeSeenIds(ids: string[]): void {
  storage.set(SEEN_KEY, JSON.stringify(ids.slice(-200)));
}

/**
 * Notifica sobre treinos prescritos que apareceram desde a ultima sincronizacao.
 * O primeiro sync apenas registra os ids (sem notificar), evitando spam no install.
 */
export async function notifyNewPrescriptions(
  prescriptions: CoachPrescription[],
): Promise<number> {
  if (prescriptions.length === 0) return 0;

  const known = new Set(readSeenIds());
  const isFirstSync = known.size === 0;
  const fresh = prescriptions.filter((item) => !known.has(item.id));

  writeSeenIds([...known, ...prescriptions.map((item) => item.id)]);

  if (isFirstSync || fresh.length === 0) return 0;

  configureHandler();

  const granted = await ensureNotificationPermission();
  if (!granted) return 0;

  await ensureAndroidChannel();

  let sent = 0;
  for (const item of fresh.slice(0, 3)) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `prescription-${item.id}`,
        content: {
          title: i18n.t("notifications.prescriptionTitle"),
          body: i18n.t("notifications.prescriptionBody", {
            name: item.name,
            count: item.exercises.length,
          }),
          data: { prescriptionId: item.id },
        },
        trigger: null,
      });
      sent += 1;
    } catch (error) {
      console.warn("[notifications] schedule failed", error);
    }
  }

  return sent;
}
