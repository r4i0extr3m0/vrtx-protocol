import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";

export type WidgetType = 'volume' | 'streak' | 'pr' | 'sessions' | 'diet' | 'water';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  visible: boolean;
  order: number;
}

interface DashboardState {
  widgets: WidgetConfig[];
  setWidgets: (widgets: WidgetConfig[]) => void;
  toggleWidget: (id: string) => void;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: '1', type: 'volume', visible: true, order: 0 },
  { id: '2', type: 'streak', visible: true, order: 1 },
  { id: '3', type: 'pr', visible: true, order: 2 },
  { id: '4', type: 'sessions', visible: true, order: 3 },
  { id: '5', type: 'diet', visible: true, order: 4 },
  { id: '6', type: 'water', visible: true, order: 5 },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgets: DEFAULT_WIDGETS,
      setWidgets: (widgets) => set({ widgets }),
      toggleWidget: (id) => set((state) => ({
        widgets: state.widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
      })),
      reorderWidgets: (fromIndex, toIndex) => set((state) => {
        const newWidgets = [...state.widgets];
        const [removed] = newWidgets.splice(fromIndex, 1);
        newWidgets.splice(toIndex, 0, removed);
        return {
          widgets: newWidgets.map((w, i) => ({ ...w, order: i }))
        };
      }),
    }),
    {
      name: "vrtxprotocol-dashboard-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
    },
  ),
);
