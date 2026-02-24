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
    <span className="font-mono tabular-nums text-xs inline-flex items-center flex-nowrap whitespace-nowrap gap-1">
      {isTimed && <TimedSets sets={sets} />}
      {!isTimed && !isWeighted && <BodyweightSets sets={sets} />}
      {!isTimed && isWeighted && <WeightedSets sets={sets} />}
      {isPerSide && (
        <span className="font-sans text-[10px] text-slate-400">c/l</span>
      )}
    </span>
  );
}

function TimedSets({ sets }: { sets: SetInput[] }) {
  const durations = sets.map((s) => s.durationSeconds ?? 0);
  const allSame = durations.every((d) => d === durations[0]);

  if (allSame) {
    return (
      <span className="inline-flex items-center bg-slate-100 rounded px-1.5 py-0.5">
        <span className="text-slate-500">{sets.length}x</span>
        <span className="text-slate-700 font-medium">{durations[0]}</span>
        <span className="text-[10px] text-slate-400 ml-px">s</span>
      </span>
    );
  }

  return (
    <>
      {durations.map((d, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-slate-300">-</span>}
          <span className="inline-flex items-center bg-slate-100 rounded px-1.5 py-0.5">
            <span className="text-slate-700 font-medium">{d}</span>
            <span className="text-[10px] text-slate-400 ml-px">s</span>
          </span>
        </Fragment>
      ))}
    </>
  );
}

function BodyweightSets({ sets }: { sets: SetInput[] }) {
  return (
    <span className="inline-flex items-center bg-slate-100 rounded px-1.5 py-0.5">
      {sets.map((s, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-slate-300 mx-px">-</span>}
          <span className="text-slate-700 font-medium">{s.reps ?? 0}</span>
        </Fragment>
      ))}
    </span>
  );
}

function WeightedSets({ sets }: { sets: SetInput[] }) {
  const groups = groupByWeight(sets);

  return (
    <>
      {groups.map((group, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-slate-300 text-[10px]">/</span>}
          <span className="inline-flex items-center bg-slate-50 border border-slate-200/60 rounded px-1.5 py-0.5">
            <span className="text-slate-400">{formatWeight(group.weight)}</span>
            <span className="text-[10px] text-slate-300 mr-0.5">kg</span>
            <span className="text-slate-300 mx-px">/</span>
            {group.reps.map((r, j) => (
              <Fragment key={j}>
                {j > 0 && <span className="text-slate-300 mx-px">-</span>}
                <span className="text-slate-700 font-medium">{r}</span>
              </Fragment>
            ))}
          </span>
        </Fragment>
      ))}
    </>
  );
}
