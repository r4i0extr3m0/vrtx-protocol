import { describe, expect, it } from "vitest";

import { findTacoFood, searchTacoFoods, TACO_FOODS } from "../src/data/tacoFoods";

describe("taco foods", () => {
  it("ships a curated starter base with unique ids", () => {
    expect(TACO_FOODS.length).toBeGreaterThan(50);
    const ids = new Set(TACO_FOODS.map((food) => food.id));
    expect(ids.size).toBe(TACO_FOODS.length);
  });

  it("matches names ignoring accents and case", () => {
    const results = searchTacoFoods("FEIJAO");
    expect(results.map((food) => food.id)).toContain("t-feijao-carioca");
  });

  it("ranks prefix matches before inner matches", () => {
    const results = searchTacoFoods("arroz");
    expect(results[0].name.toLowerCase()).toContain("arroz");
  });

  it("falls back to the first foods when the query is empty", () => {
    expect(searchTacoFoods("")).toHaveLength(30);
  });

  it("finds a food by id", () => {
    expect(findTacoFood("t-frango-peito")?.name).toContain("Frango");
    expect(findTacoFood("does-not-exist")).toBeNull();
    expect(findTacoFood(null)).toBeNull();
  });
});
