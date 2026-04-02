import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMemoryJsonStorage } from "../src/test-utils";

describe("exerciseStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates an exercise and enqueues a sync operation", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useExerciseStore } = await import("../src/store/exerciseStore");
    const exercise = useExerciseStore.getState().createExercise({
      name: "Supino reto",
      muscleGroup: "Peito",
    });

    expect(exercise.name).toBe("Supino reto");
    expect(exercise.syncStatus).toBe("pending");
    expect(useExerciseStore.getState().exercises).toHaveLength(1);
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ entity: "exercise", type: "create" }),
    );
  });

  it("updates an exercise and enqueues a sync operation", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useExerciseStore } = await import("../src/store/exerciseStore");
    const exercise = useExerciseStore.getState().createExercise({ name: "Agachamento", muscleGroup: "Pernas" });
    useExerciseStore.getState().updateExercise(exercise.id, { name: "Agachamento livre" });

    const updated = useExerciseStore.getState().exercises.find((e) => e.id === exercise.id);
    expect(updated?.name).toBe("Agachamento livre");
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenLastCalledWith(
      expect.objectContaining({ entity: "exercise", type: "update" }),
    );
  });

  it("deletes an exercise and enqueues a delete sync operation", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useExerciseStore } = await import("../src/store/exerciseStore");
    const exercise = useExerciseStore.getState().createExercise({ name: "Remada", muscleGroup: "Costas" });
    useExerciseStore.getState().deleteExercise(exercise.id);

    expect(useExerciseStore.getState().exercises).toHaveLength(0);
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenLastCalledWith(
      expect.objectContaining({ entity: "exercise", type: "delete" }),
    );
  });
});

describe("templateStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates a template with exercises and enqueues a sync operation", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useTemplateStore } = await import("../src/store/templateStore");
    const template = useTemplateStore.getState().createTemplate("Push A", [
      { exerciseId: "ex-1", exerciseName: "Supino", muscleGroup: "Peito", sets: 3, repsTarget: 10 },
    ]);

    expect(template.name).toBe("Push A");
    expect(template.exercises).toHaveLength(1);
    expect(template.syncStatus).toBe("pending");
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ entity: "template", type: "create" }),
    );
  });

  it("updates a template and enqueues a sync operation", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useTemplateStore } = await import("../src/store/templateStore");
    const template = useTemplateStore.getState().createTemplate("Pull A");
    useTemplateStore.getState().updateTemplate(template.id, { name: "Pull B" });

    const updated = useTemplateStore.getState().templates.find((t) => t.id === template.id);
    expect(updated?.name).toBe("Pull B");
    expect(enqueue).toHaveBeenCalledTimes(2);
  });

  it("deletes a template and enqueues a delete sync operation", async () => {
    const storage = createMemoryJsonStorage();
    const enqueue = vi.fn();

    vi.doMock("@/src/infra/mmkv", () => ({ mmkvJsonStorage: storage }));
    vi.doMock("@/src/store/syncStore", () => ({
      useSyncStore: { getState: () => ({ enqueue }) },
    }));

    const { useTemplateStore } = await import("../src/store/templateStore");
    const template = useTemplateStore.getState().createTemplate("Legs A");
    useTemplateStore.getState().deleteTemplate(template.id);

    expect(useTemplateStore.getState().templates).toHaveLength(0);
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenLastCalledWith(
      expect.objectContaining({ entity: "template", type: "delete" }),
    );
  });
});
