"use client";

import { useState, useTransition } from "react";
import { Drawer, DrawerTitle } from "@/components/ui/Drawer";
import { updateTrainerExercise } from "@/lib/trainer/actions/updateExercise";
import type { TrainerExercise } from "@/lib/trainer/getTrainerExercises";
import type { ExerciseType } from "@prisma/client";

const typeOptions: { value: ExerciseType; label: string }[] = [
  { value: "weighted", label: "Peso" },
  { value: "bodyweight", label: "Corporal" },
  { value: "timed", label: "Tiempo" },
];

type Props = {
  exercise: TrainerExercise;
  open: boolean;
  onClose: () => void;
};

function ExerciseEditForm({
  exercise,
  onClose,
}: {
  exercise: TrainerExercise;
  onClose: () => void;
}) {
  const [name, setName] = useState(exercise.name);
  const [exerciseType, setExerciseType] = useState<ExerciseType>(
    exercise.exerciseType
  );
  const [instructions, setInstructions] = useState(exercise.instructions ?? "");
  const [videoUrl, setVideoUrl] = useState(exercise.videoUrl ?? "");
  const [tagsInput, setTagsInput] = useState(exercise.tags.join(", "));
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await updateTrainerExercise(exercise.id, {
        name: name.trim(),
        exerciseType,
        instructions: instructions.trim() || null,
        videoUrl: videoUrl.trim() || null,
        tags,
      });
      onClose();
    });
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Tipo
        </label>
        <div className="flex gap-2">
          {typeOptions.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setExerciseType(t.value)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                exerciseType === t.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Instrucciones
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="Indicaciones de técnica, cues..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
        />
      </div>

      {/* Video URL */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Video URL
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Tags
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="pecho, compuesto, empuje"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300"
        />
        <p className="text-[10px] text-slate-400 mt-1">Separados por coma</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="flex-1 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="flex-1 px-4 py-2 text-sm text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

export default function ExerciseEditModal({ exercise, open, onClose }: Props) {
  if (!open) return null;

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerTitle>Editar ejercicio</DrawerTitle>
      <ExerciseEditForm exercise={exercise} onClose={onClose} />
    </Drawer>
  );
}
