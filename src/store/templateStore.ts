import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvJsonStorage } from "@/src/infra/mmkv";
import { useSyncStore } from "@/src/store/syncStore";
import type { Template, TemplateExercise } from "@/src/types";
import { createId, toIsoTimestamp } from "@/src/utils";

interface TemplateStoreState {
  templates: Template[];
  hydrated: boolean;
  createTemplate: (name: string, exercises?: TemplateExercise[]) => Template;
  updateTemplate: (id: string, partial: Partial<Pick<Template, "name" | "exercises">>) => void;
  deleteTemplate: (id: string) => void;
  setHydrated: (value: boolean) => void;
}

function enqueueTemplateOperation(type: "create" | "update" | "delete", template: Template): void {
  useSyncStore.getState().enqueue({
    id: createId("sync"),
    entity: "template",
    type,
    table: "templates",
    data: template,
    timestamp: Date.now(),
    retries: 0,
  });
}

export const useTemplateStore = create<TemplateStoreState>()(
  persist(
    (set, get) => ({
      templates: [],
      hydrated: false,
      createTemplate: (name, exercises = []) => {
        const template: Template = {
          id: createId("template"),
          name,
          exercises,
          createdAt: toIsoTimestamp(new Date()),
          syncStatus: "pending",
        };
        set((state) => ({ templates: [template, ...state.templates] }));
        enqueueTemplateOperation("create", template);
        return template;
      },
      updateTemplate: (id, partial) => {
        const nextTemplates = get().templates.map((t) =>
          t.id === id ? { ...t, ...partial, syncStatus: "pending" as const } : t,
        );
        const updated = nextTemplates.find((t) => t.id === id);
        set({ templates: nextTemplates });
        if (updated) {
          enqueueTemplateOperation("update", updated);
        }
      },
      deleteTemplate: (id) => {
        const target = get().templates.find((t) => t.id === id);
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
        if (target) {
          enqueueTemplateOperation("delete", target);
        }
      },
      setHydrated: (value) => {
        set({ hydrated: value });
      },
    }),
    {
      name: "coreirontrack-template-store",
      storage: createJSONStorage(() => mmkvJsonStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
