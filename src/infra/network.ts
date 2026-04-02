import * as Network from "expo-network";

function isBrowserClient(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export async function isInternetReachable(): Promise<boolean> {
  if (!isBrowserClient()) {
    return false;
  }

  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export function subscribeToNetworkState(listener: (reachable: boolean) => void): () => void {
  if (!isBrowserClient()) {
    return () => undefined;
  }

  const subscription = Network.addNetworkStateListener((state) => {
    listener(Boolean(state.isConnected && state.isInternetReachable !== false));
  });

  return () => {
    subscription.remove();
  };
}
