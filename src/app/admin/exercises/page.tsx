import { redirect } from "next/navigation";
import getUser from "@/lib/auth/getUser";
import { getGlobalExercises } from "@/lib/admin/getGlobalExercises";
import AdminExerciseList from "@/components/admin/AdminExerciseList";
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

export default async function AdminExercisesPage({ searchParams }: Props) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const exercises = await getGlobalExercises({
    search: sp.search,
    type: parseExerciseType(sp.type),
  });

  return (
    <PageShell title="Ejercicios globales">
      <AdminExerciseList exercises={exercises} />
    </PageShell>
  );
}
