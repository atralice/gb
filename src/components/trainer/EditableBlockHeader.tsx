"use client";

import { useState, useTransition } from "react";
import BlockHeader from "@/components/workout/BlockHeader";
import { updateBlockComment } from "@/lib/workouts/actions/updateBlockComment";

type EditableBlockHeaderProps = {
  blockId: string;
  title: string;
  comment?: string | null;
  tags?: string[];
};

const EditableBlockHeader = ({
  title,
  comment,
  tags = [],
  blockId,
}: EditableBlockHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(comment ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateBlockComment({
        blockId,
        comment: editedComment.trim() || null,
      });
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setEditedComment(comment ?? "");
    setIsEditing(false);
  };

  return (
    <BlockHeader title={title} tags={tags}>
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
    </BlockHeader>
  );
};

export default EditableBlockHeader;
