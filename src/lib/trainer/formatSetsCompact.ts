type SetInput = {
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  repsPerSide: boolean;
};

function formatWeight(weight: number): string {
  // Use comma as decimal separator (European notation)
  const str = String(weight);
  return str.replace(".", ",");
}

export function formatSetsCompact(sets: SetInput[]): string {
  if (sets.length === 0) return "";

  const [first] = sets;
  if (!first) return "";

  const isPerSide = sets.some((s) => s.repsPerSide);
  const isTimed = first.durationSeconds != null && first.reps == null;
  const isWeighted = first.weightKg != null;

  let result: string;

  if (isTimed) {
    result = formatTimed(sets);
  } else if (isWeighted) {
    result = formatWeighted(sets);
  } else {
    result = formatBodyweight(sets);
  }

  if (isPerSide) {
    result += " c/l";
  }

  return result;
}

function formatTimed(sets: SetInput[]): string {
  const durations = sets.map((s) => s.durationSeconds ?? 0);
  const allSame = durations.every((d) => d === durations[0]);

  if (allSame) {
    return `${sets.length}x${durations[0]}s`;
  }

  return durations.map((d) => `${d}s`).join("-");
}

function formatBodyweight(sets: SetInput[]): string {
  return sets.map((s) => String(s.reps)).join("-");
}

function formatWeighted(sets: SetInput[]): string {
  // Group consecutive sets by weight
  const groups: { weight: number; reps: number[] }[] = [];

  for (const set of sets) {
    const weight = set.weightKg ?? 0;
    const reps = set.reps ?? 0;
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.weight === weight) {
      lastGroup.reps.push(reps);
    } else {
      groups.push({ weight, reps: [reps] });
    }
  }

  const parts = groups.map((group) => {
    const weightStr = formatWeight(group.weight);
    const repsStr = group.reps.join("-");
    return `${weightStr}/${repsStr}`;
  });

  return parts.join(" - ");
}
