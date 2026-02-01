import type { WorkoutDayWithBlocks } from "./getWorkoutDay";

type WorkoutBlock = NonNullable<WorkoutDayWithBlocks>["blocks"][number];

export function getBlocksByOrder(
  blocks: WorkoutBlock[]
): Map<number, WorkoutBlock> {
  return new Map(blocks.map((block) => [block.order, block]));
}

export function getBlockLabel(block: WorkoutBlock): string {
  if (block.label) {
    return block.label;
  }

  // Default labels based on order
  const defaultLabels: Record<number, string> = {
    0: "Calentamiento",
    1: "Bloque A",
    2: "Bloque B",
    3: "Bloque C",
  };

  return defaultLabels[block.order] ?? `Bloque ${block.order}`;
}
