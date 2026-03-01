"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type Props = {
  onReplace: () => void;
  onRemove: () => void;
};

export default function ExerciseMenu({ onReplace, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setConfirmRemove(false);
  }, []);

  const handleOpen = () => {
    if (open) {
      close();
      return;
    }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - 160,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        e.target instanceof Node &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, close]);

  const dropdown = open ? (
    <div
      ref={menuRef}
      className="fixed w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-[100] py-1"
      style={{ top: position.top, left: position.left }}
    >
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
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className="w-6 h-6 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs transition-colors"
      >
        &middot;&middot;&middot;
      </button>
      {dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
