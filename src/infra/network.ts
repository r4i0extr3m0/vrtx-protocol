import * as Network from "expo-network";

export async function isInternetReachable(): Promise<boolean> {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export function subscribeToNetworkState(listener: (reachable: boolean) => void): () => void {
  const subscription = Network.addNetworkStateListener((state) => {
    listener(Boolean(state.isConnected && state.isInternetReachable !== false));
  });

  return () => {
    subscription.remove();
  };
}
