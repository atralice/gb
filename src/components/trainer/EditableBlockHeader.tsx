"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { BlockType } from "@/types/workout";
import { updateBlockComment } from "@/lib/workouts/actions/updateBlockComment";

type EditableBlockHeaderProps = {
  block: BlockType;
  title: string;
  comment?: string;
  tags?: string[];
  workoutDayId: string;
};

const tagColorClasses = [
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-sky-200 bg-sky-50 text-sky-700",
  "border-purple-200 bg-purple-50 text-purple-700",
  "border-orange-200 bg-orange-50 text-orange-700",
  "border-rose-200 bg-rose-50 text-rose-700",
];

const EditableBlockHeader = ({
  title,
  comment,
  tags = [],
  workoutDayId,
  block,
}: EditableBlockHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(comment ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateBlockComment({
        workoutDayId,
        block,
        comment: editedComment.trim(),
      });
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setEditedComment(comment ?? "");
    setIsEditing(false);
  };

  return (
    <header className="mb-1.5 flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {title}
        </span>
        {tags.map((tag, index) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium",
              tagColorClasses[index % tagColorClasses.length]
            )}
          >
            {tag}
          </span>
        ))}
      </div>
      {isEditing ? (
        <div>
          <textarea
            value={editedComment}
            onChange={(e) => setEditedComment(e.target.value)}
            placeholder="Agregar comentario del bloque..."
            className="w-full rounded border border-slate-300 px-2 py-1 text-[10px] leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={2}
            disabled={isPending}
          />
          <div className="mt-1 flex gap-1">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="rounded bg-slate-300 px-2 py-0.5 text-[10px] hover:bg-slate-400 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div>
          {comment ? (
            <span
              className="cursor-pointer text-[10px] text-slate-500 hover:text-slate-700"
              onClick={() => setIsEditing(true)}
            >
              {comment}
            </span>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              + Agregar comentario del bloque
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default EditableBlockHeader;
