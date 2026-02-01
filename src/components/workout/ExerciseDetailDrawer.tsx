"use client";

import { Drawer, DrawerTitle } from "@/components/ui/Drawer";
import type { WorkoutDayWithBlocks } from "@/lib/workouts/getWorkoutDay";

type Exercise =
  NonNullable<WorkoutDayWithBlocks>["blocks"][number]["exercises"][number];

const tagColors: Record<string, string> = {
  fuerza: "bg-blue-100 text-blue-700",
  piernas: "bg-amber-100 text-amber-700",
  unilateral: "bg-purple-100 text-purple-700",
  pecho: "bg-rose-100 text-rose-700",
  espalda: "bg-cyan-100 text-cyan-700",
  core: "bg-green-100 text-green-700",
  pliometrico: "bg-orange-100 text-orange-700",
  gluteos: "bg-pink-100 text-pink-700",
  movilidad: "bg-teal-100 text-teal-700",
  agilidad: "bg-indigo-100 text-indigo-700",
  isquiotibiales: "bg-yellow-100 text-yellow-700",
  "espalda baja": "bg-slate-200 text-slate-700",
  hombros: "bg-sky-100 text-sky-700",
  pull: "bg-violet-100 text-violet-700",
  potencia: "bg-red-100 text-red-700",
  warmup: "bg-lime-100 text-lime-700",
  estabilidad: "bg-emerald-100 text-emerald-700",
  activacion: "bg-fuchsia-100 text-fuchsia-700",
  "full body": "bg-gray-100 text-gray-700",
  "anti-rotacion": "bg-stone-100 text-stone-700",
};

type ExerciseDetailDrawerProps = {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ExerciseDetailDrawer({
  exercise,
  open,
  onOpenChange,
}: ExerciseDetailDrawerProps) {
  if (!exercise) return null;

  const { exercise: exerciseData, comment } = exercise;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTitle>{exerciseData.name}</DrawerTitle>

      {/* Tags */}
      {exerciseData.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {exerciseData.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                tagColors[tag] || "bg-slate-100 text-slate-600"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Instructions */}
      {exerciseData.instructions && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-slate-500">
            Instrucciones
          </h3>
          <p className="leading-relaxed text-slate-700">
            {exerciseData.instructions}
          </p>
        </div>
      )}

      {/* Session comment */}
      {comment && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <h3 className="mb-1 text-sm font-medium text-amber-700">
            Nota de hoy
          </h3>
          <p className="text-sm text-amber-800">{comment}</p>
        </div>
      )}

      {/* Video link */}
      {exerciseData.videoUrl && (
        <a
          href={exerciseData.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700 transition-colors hover:bg-red-100"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600">
            <svg
              className="h-5 w-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Ver video</p>
            <p className="text-xs opacity-75">Abrir en YouTube</p>
          </div>
          <svg
            className="ml-auto h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}

      {/* Close button */}
      <button
        onClick={() => onOpenChange(false)}
        className="w-full rounded-xl bg-slate-100 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-200"
      >
        Cerrar
      </button>
    </Drawer>
  );
}
