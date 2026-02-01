import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import WorkoutPlanEditor from "@/components/trainer/WorkoutPlanEditor";

type PageProps = {
  params: Promise<{ athleteId: string }>;
};

export default async function TrainerPlanPage({ params }: PageProps) {
  const { athleteId } = await params;

  // TODO: Add authentication check - verify current user is a trainer
  // TODO: Add authorization check - verify trainer has access to this athlete

  // Get athlete
  const athlete = await prisma.user.findUnique({
    where: {
      id: athleteId,
      role: UserRole.athlete,
    },
  });

  if (!athlete) {
    notFound();
  }

  // Get all workout days for this athlete
  const workoutDays = await prisma.workoutDay.findMany({
    where: {
      athleteId,
    },
    include: {
      blocks: {
        include: {
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  videoUrl: true,
                  tags: true,
                },
              },
              sets: {
                orderBy: {
                  setIndex: "asc",
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ weekNumber: "desc" }, { dayIndex: "asc" }],
  });

  return (
    <main className="min-h-screen bg-slate-50 p-2 md:p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-900">
            Plan de entrenamiento
          </h1>
          <p className="text-xs text-slate-600">
            {athlete.name || athlete.email}
          </p>
        </div>

        <WorkoutPlanEditor athleteId={athleteId} workoutDays={workoutDays} />
      </div>
    </main>
  );
}
