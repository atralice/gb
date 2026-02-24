import { describe, test, expect } from "bun:test";
import { formatSetsCompact } from "../formatSetsCompact";

describe("formatSetsCompact", () => {
  test("bodyweight same reps: 3-3-3", () => {
    const sets = [
      { reps: 3, weightKg: null, durationSeconds: null, repsPerSide: false },
      { reps: 3, weightKg: null, durationSeconds: null, repsPerSide: false },
      { reps: 3, weightKg: null, durationSeconds: null, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("3-3-3");
  });

  test("bodyweight varying reps: 10-8-8", () => {
    const sets = [
      { reps: 10, weightKg: null, durationSeconds: null, repsPerSide: false },
      { reps: 8, weightKg: null, durationSeconds: null, repsPerSide: false },
      { reps: 8, weightKg: null, durationSeconds: null, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("10-8-8");
  });

  test("weighted same weight: 100/8-8-6", () => {
    const sets = [
      { reps: 8, weightKg: 100, durationSeconds: null, repsPerSide: false },
      { reps: 8, weightKg: 100, durationSeconds: null, repsPerSide: false },
      { reps: 6, weightKg: 100, durationSeconds: null, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("100/8-8-6");
  });

  test("weighted mixed: 60/5 - 85/4 - 100/3-3-2", () => {
    const sets = [
      { reps: 5, weightKg: 60, durationSeconds: null, repsPerSide: false },
      { reps: 4, weightKg: 85, durationSeconds: null, repsPerSide: false },
      { reps: 3, weightKg: 100, durationSeconds: null, repsPerSide: false },
      { reps: 3, weightKg: 100, durationSeconds: null, repsPerSide: false },
      { reps: 2, weightKg: 100, durationSeconds: null, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("60/5 - 85/4 - 100/3-3-2");
  });

  test("timed: 3x40s", () => {
    const sets = [
      { reps: null, weightKg: null, durationSeconds: 40, repsPerSide: false },
      { reps: null, weightKg: null, durationSeconds: 40, repsPerSide: false },
      { reps: null, weightKg: null, durationSeconds: 40, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("3x40s");
  });

  test("timed mixed durations: 40s-50s-50s", () => {
    const sets = [
      { reps: null, weightKg: null, durationSeconds: 40, repsPerSide: false },
      { reps: null, weightKg: null, durationSeconds: 50, repsPerSide: false },
      { reps: null, weightKg: null, durationSeconds: 50, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("40s-50s-50s");
  });

  test("per-side appends c/l: 8-8-6 c/l", () => {
    const sets = [
      { reps: 8, weightKg: null, durationSeconds: null, repsPerSide: true },
      { reps: 8, weightKg: null, durationSeconds: null, repsPerSide: true },
      { reps: 6, weightKg: null, durationSeconds: null, repsPerSide: true },
    ];
    expect(formatSetsCompact(sets)).toBe("8-8-6 c/l");
  });

  test("weighted per-side: 15/6-6-6 c/l", () => {
    const sets = [
      { reps: 6, weightKg: 15, durationSeconds: null, repsPerSide: true },
      { reps: 6, weightKg: 15, durationSeconds: null, repsPerSide: true },
      { reps: 6, weightKg: 15, durationSeconds: null, repsPerSide: true },
    ];
    expect(formatSetsCompact(sets)).toBe("15/6-6-6 c/l");
  });

  test("decimal weight: 17,5/4-4-4", () => {
    const sets = [
      { reps: 4, weightKg: 17.5, durationSeconds: null, repsPerSide: false },
      { reps: 4, weightKg: 17.5, durationSeconds: null, repsPerSide: false },
      { reps: 4, weightKg: 17.5, durationSeconds: null, repsPerSide: false },
    ];
    expect(formatSetsCompact(sets)).toBe("17,5/4-4-4");
  });

  test("empty sets returns empty string", () => {
    expect(formatSetsCompact([])).toBe("");
  });
});
