export enum BlockType {
  warmup = "warmup",
  a = "a",
  b = "b",
  c = "c",
}

export const blockLabels: Record<BlockType, string> = {
  [BlockType.warmup]: "Calentamiento",
  [BlockType.a]: "Bloque A",
  [BlockType.b]: "Bloque B",
  [BlockType.c]: "Bloque C",
};
