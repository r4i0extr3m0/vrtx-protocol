import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAIUsage, type AIUsageResponse } from '@/src/services/AIInsights';

interface PremiumState {
  isPremium: boolean;
  subscriptionType: 'none' | 'monthly' | 'yearly' | 'lifetime';
  expiryDate: string | null;
  aiUsage: AIUsageResponse | null;
  setPremium: (isPremium: boolean, type: PremiumState['subscriptionType'], expiry?: string) => void;
  resetPremium: () => void;
  setAIUsage: (usage: AIUsageResponse | null) => void;
  refreshAIUsage: (userId: string) => Promise<void>;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      isPremium: false,
      subscriptionType: 'none',
      expiryDate: null,
      aiUsage: null,
      setPremium: (isPremium, type, expiry) => set({ 
        isPremium, 
        subscriptionType: type, 
        expiryDate: expiry || null 
      }),
      resetPremium: () => set({ 
        isPremium: false, 
        subscriptionType: 'none', 
        expiryDate: null,
        aiUsage: null,
      }),
      setAIUsage: (usage) => set({ aiUsage: usage, isPremium: usage?.is_premium ?? false }),
      refreshAIUsage: async (userId: string) => {
        try {
          const usage = await fetchAIUsage(userId);
          set({ aiUsage: usage, isPremium: usage.is_premium });
        } catch {
          // Não quebra a UI em caso de erro de rede
        }
      },
    }),
    {
      name: 'premium-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
