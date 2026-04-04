import { Platform } from "react-native";
import Purchases, { LOG_LEVEL, type CustomerInfo } from "react-native-purchases";

import { env } from "@/src/constants/env";

let configured = false;
let currentAppUserId: string | null = null;

export function isRevenueCatConfigured(): boolean {
  return configured;
}

export async function configureRevenueCat(): Promise<void> {
  if (configured) return;

  const apiKey = Platform.OS === "ios" ? env.revenueCatIosApiKey : env.revenueCatAndroidApiKey;
  if (!apiKey) {
    // Não quebra o app sem chave (ambiente dev)
    return;
  }

  Purchases.setLogLevel(LOG_LEVEL.INFO);
  Purchases.configure({ apiKey });
  configured = true;
}

export async function loginRevenueCat(userId: string): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logIn(userId);
    currentAppUserId = userId;
  } catch {
    // ignore
  }
}

export async function logoutRevenueCat(): Promise<void> {
  if (!configured) return;
  if (!currentAppUserId) return;
  try {
    await Purchases.logOut();
    currentAppUserId = null;
  } catch {
    // ignore
  }
}

export async function getRevenueCatCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export function hasProEntitlement(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  const ent = customerInfo.entitlements?.active?.[env.revenueCatEntitlementId];
  return Boolean(ent);
}

