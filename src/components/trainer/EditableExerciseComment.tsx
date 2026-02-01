"use client";

import { useState, useTransition } from "react";
import { updateExerciseComment } from "@/lib/workouts/actions/updateExerciseComment";

type EditableExerciseCommentProps = {
  workoutBlockExerciseId: string;
  initialComment: string | null;
};

const EditableExerciseComment = ({
  workoutBlockExerciseId,
  initialComment,
}: EditableExerciseCommentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState(initialComment ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateExerciseComment({
        workoutBlockExerciseId,
        comment: comment.trim() || null,
      });
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setComment(initialComment ?? "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="mt-1">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Agregar comentario..."
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          rows={2}
          disabled={isPending}
        />
        <div className="mt-1 flex gap-1">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded bg-indigo-600 px-2 py-0.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Guardar
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="rounded bg-slate-300 px-2 py-0.5 text-xs hover:bg-slate-400 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1">
      {initialComment ? (
        <p
          className="cursor-pointer text-xs text-slate-600 leading-relaxed hover:text-slate-900"
          onClick={() => setIsEditing(true)}
        >
          {initialComment}
        </p>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          + Agregar comentario
        </button>
      )}
    </div>
  );
};

export default EditableExerciseComment;
