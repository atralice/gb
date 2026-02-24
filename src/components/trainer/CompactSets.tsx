import { Fragment } from "react";

type SetInput = {
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  repsPerSide: boolean;
};

type WeightGroup = {
  weight: number;
  reps: number[];
};

function formatWeight(weight: number): string {
  const str = String(weight);
  return str.replace(".", ",");
}

function groupByWeight(sets: SetInput[]): WeightGroup[] {
  const groups: WeightGroup[] = [];

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

  return groups;
}

export default function CompactSets({ sets }: { sets: SetInput[] }) {
  if (sets.length === 0) {
    return <span className="text-slate-300">—</span>;
  }

  const first = sets[0];
  if (!first) return <span className="text-slate-300">—</span>;

  const isPerSide = sets.some((s) => s.repsPerSide);
  const isTimed = first.durationSeconds != null && first.reps == null;
  const isWeighted = first.weightKg != null;

  return (
    <span className="font-mono tabular-nums text-xs leading-none inline-flex items-baseline flex-nowrap whitespace-nowrap">
      {isTimed && <TimedSets sets={sets} />}
      {!isTimed && !isWeighted && <BodyweightSets sets={sets} />}
      {!isTimed && isWeighted && <WeightedSets sets={sets} />}
      {isPerSide && <span className="text-slate-400 ml-0.5">c/l</span>}
    </span>
  );
}

function TimedSets({ sets }: { sets: SetInput[] }) {
  const durations = sets.map((s) => s.durationSeconds ?? 0);
  const allSame = durations.every((d) => d === durations[0]);

  if (allSame) {
    return (
      <>
        <span className="text-slate-500">{sets.length}x</span>
        <span>{durations[0]}s</span>
      </>
    );
  }

  return (
    <>
      {durations.map((d, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-slate-300">-</span>}
          <span>{d}s</span>
        </Fragment>
      ))}
    </>
  );
}

function BodyweightSets({ sets }: { sets: SetInput[] }) {
  return (
    <>
      {sets.map((s, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-slate-300">-</span>}
          <span>{s.reps ?? 0}</span>
        </Fragment>
      ))}
    </>
  );
}

function WeightedSets({ sets }: { sets: SetInput[] }) {
  const groups = groupByWeight(sets);

  return (
    <>
      {groups.map((group, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-slate-300 mx-0.5">&ndash;</span>}
          <span className="text-slate-400">{formatWeight(group.weight)}/</span>
          <span>
            {group.reps.map((r, j) => (
              <Fragment key={j}>
                {j > 0 && <span className="text-slate-300">-</span>}
                <span>{r}</span>
              </Fragment>
            ))}
          </span>
        </Fragment>
      ))}
    </>
  );
}
