export const TAG_COLOR_CLASSES = [
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-sky-200 bg-sky-50 text-sky-700",
  "border-purple-200 bg-purple-50 text-purple-700",
  "border-orange-200 bg-orange-50 text-orange-700",
  "border-rose-200 bg-rose-50 text-rose-700",
] as const;

export function getTagColorClass(index: number): string {
  return (
    TAG_COLOR_CLASSES[index % TAG_COLOR_CLASSES.length] ?? TAG_COLOR_CLASSES[0]
  );
}
