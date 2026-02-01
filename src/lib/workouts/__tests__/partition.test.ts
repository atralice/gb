import { describe, test, expect } from "bun:test";
import { getBlockLabel, getBlocksByOrder } from "../partition";
import type { WorkoutDayWithBlocks } from "../getWorkoutDay";

type WorkoutBlock = NonNullable<WorkoutDayWithBlocks>["blocks"][number];

function buildBlock(order: number, label?: string | null): WorkoutBlock {
  return {
    id: `block-${order}`,
    workoutDayId: "workout-day-1",
    order,
    label: label ?? null,
    comment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    exercises: [],
  };
}

describe("getBlockLabel", () => {
  test("returns custom label when provided", () => {
    const block = buildBlock(1, "Custom Block");
    expect(getBlockLabel(block)).toBe("Custom Block");
  });

  test("returns default warmup label for order 0", () => {
    const block = buildBlock(0);
    expect(getBlockLabel(block)).toBe("Calentamiento");
  });

  test("returns default Bloque A for order 1", () => {
    const block = buildBlock(1);
    expect(getBlockLabel(block)).toBe("Bloque A");
  });

  test("returns default Bloque B for order 2", () => {
    const block = buildBlock(2);
    expect(getBlockLabel(block)).toBe("Bloque B");
  });

  test("returns default Bloque C for order 3", () => {
    const block = buildBlock(3);
    expect(getBlockLabel(block)).toBe("Bloque C");
  });

  test("returns generic label for unknown order", () => {
    const block = buildBlock(5);
    expect(getBlockLabel(block)).toBe("Bloque 5");
  });
});

describe("getBlocksByOrder", () => {
  test("returns map of blocks by order", () => {
    const blocks = [
      buildBlock(0, "Warmup"),
      buildBlock(1, "A"),
      buildBlock(2, "B"),
    ];

    const result = getBlocksByOrder(blocks);

    expect(result.size).toBe(3);
    expect(result.get(0)?.label).toBe("Warmup");
    expect(result.get(1)?.label).toBe("A");
    expect(result.get(2)?.label).toBe("B");
  });

  test("handles empty array", () => {
    const result = getBlocksByOrder([]);
    expect(result.size).toBe(0);
  });
});
