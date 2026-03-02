"use client";

import type { AthleteWeekExercise } from "@/lib/trainer/getAthleteWeek";
import type { SetInputConfig } from "./resolveValue";
import { resolveValue } from "./resolveValue";
import { useWeekDetailState, useWeekDetailActions } from "./weekDetailContext";
import SetCell from "../SetCell";

type Props = {
  exercise: AthleteWeekExercise;
  globalMaxSets: number;
  inputs: SetInputConfig[];
};

export default function SetCellGroup({
  exercise,
  globalMaxSets,
  inputs,
}: Props) {
  const { editedSets } = useWeekDetailState();
  const { onSetChange, openDrawer } = useWeekDetailActions();

  return (
    <>
      {Array.from({ length: globalMaxSets }, (_, i) => {
        const set = exercise.sets[i];

        if (!set) {
          return <td key={`empty-${i}`} className="px-3 py-2 text-center" />;
        }

        return (
          <td key={set.id} className="px-3 py-2 text-center">
            <div className="flex flex-col items-center gap-1">
              {inputs.map((input) => {
                const resolved = resolveValue(
                  exercise.sets,
                  i,
                  input.field,
                  editedSets,
                  input.defaultValue
                );
                return (
                  <SetCell
                    key={input.field}
                    value={resolved}
                    unit={input.unit}
                    step={input.step}
                    min={input.min}
                    max={input.max}
                    onChange={(v) => {
                      // Pin later sibling null sets to their current
                      // resolved values BEFORE applying the edit, so
                      // they don't inherit the new persisted value
                      // after save + refetch.
                      for (let j = i + 1; j < exercise.sets.length; j++) {
                        const sibling = exercise.sets[j];
                        if (!sibling) continue;
                        if (
                          sibling[input.field] !== null &&
                          sibling[input.field] !== undefined
                        )
                          continue;
                        const siblingEdited = editedSets.get(sibling.id);
                        if (
                          siblingEdited &&
                          siblingEdited[input.field] !== undefined
                        )
                          continue;
                        const siblingResolved = resolveValue(
                          exercise.sets,
                          j,
                          input.field,
                          editedSets,
                          input.defaultValue
                        );
                        onSetChange(sibling.id, input.field, siblingResolved);
                      }
                      onSetChange(set.id, input.field, v);
                    }}
                    onDoubleClick={() => {
                      const allValues: Record<string, number> = {};
                      for (const inp of inputs) {
                        allValues[inp.field] = resolveValue(
                          exercise.sets,
                          i,
                          inp.field,
                          editedSets,
                          inp.defaultValue
                        );
                      }
                      openDrawer({
                        open: true,
                        exerciseName: exercise.exerciseName,
                        setIndex: i,
                        totalSets: exercise.sets.length,
                        setId: set.id,
                        inputs,
                        values: allValues,
                      });
                    }}
                  />
                );
              })}
            </div>
          </td>
        );
      })}
    </>
  );
}
