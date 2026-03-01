"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Props = {
  onReplace: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export default function ExerciseMenu({
  onReplace,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setConfirmRemove(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        e.target instanceof Node &&
        !menuRef.current.contains(e.target)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, close]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => (open ? close() : setOpen(true))}
        className="w-6 h-6 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors"
      >
        &middot;&middot;&middot;
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1">
          {onMoveUp && (
            <button
              onClick={() => {
                onMoveUp();
                close();
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Mover arriba
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={() => {
                onMoveDown();
                close();
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Mover abajo
            </button>
          )}
          <button
            onClick={() => {
              onReplace();
              close();
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Reemplazar ejercicio
          </button>
          {!confirmRemove ? (
            <button
              onClick={() => setConfirmRemove(true)}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Eliminar
            </button>
          ) : (
            <button
              onClick={() => {
                onRemove();
                close();
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 bg-red-50 font-medium"
            >
              Confirmar eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
