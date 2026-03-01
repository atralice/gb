import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getTrainerExercises } from "@/lib/trainer/getTrainerExercises";
import ExerciseLibrary from "@/components/trainer/ExerciseLibrary";
import PageShell from "@/components/ui/PageShell";

import type { ExerciseType } from "@prisma/client";

const validTypes: Record<string, ExerciseType> = {
  weighted: "weighted",
  bodyweight: "bodyweight",
  timed: "timed",
};

function parseExerciseType(value?: string): ExerciseType | undefined {
  if (value) return validTypes[value];
  return undefined;
}

type Props = {
  searchParams: Promise<{ search?: string; type?: string }>;
};

export default async function TrainerExercisesPage({ searchParams }: Props) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  if (!user) redirect("/login");
  if (user.role !== "trainer") redirect("/");

  const exercises = await getTrainerExercises(user.id, {
    search: sp.search,
    type: parseExerciseType(sp.type),
  });

  return (
    <PageShell backHref="/trainer/athletes" title="Mis ejercicios">
      <ExerciseLibrary exercises={exercises} />
    </PageShell>
  );
}
