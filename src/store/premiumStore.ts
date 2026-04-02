import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PremiumState {
  isPremium: boolean;
  subscriptionType: 'none' | 'monthly' | 'yearly' | 'lifetime';
  expiryDate: string | null;
  setPremium: (isPremium: boolean, type: PremiumState['subscriptionType'], expiry?: string) => void;
  resetPremium: () => void;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      isPremium: false,
      subscriptionType: 'none',
      expiryDate: null,
      setPremium: (isPremium, type, expiry) => set({ 
        isPremium, 
        subscriptionType: type, 
        expiryDate: expiry || null 
      }),
      resetPremium: () => set({ 
        isPremium: false, 
        subscriptionType: 'none', 
        expiryDate: null 
      }),
    }),
    {
      name: 'premium-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
