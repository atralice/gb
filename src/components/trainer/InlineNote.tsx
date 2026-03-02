"use client";

import { useState, useRef } from "react";

type Props = {
  value: string | null;
  onSave: (value: string) => void;
  placeholder?: string;
};

export default function InlineNote({
  value,
  onSave,
  placeholder = "+ nota",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setDraft(value ?? "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    setEditing(false);
    if (draft !== (value ?? "")) {
      onSave(draft);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditing(false);
      setDraft(value ?? "");
    }
  };

  if (!editing) {
    return (
      <button
        onClick={handleOpen}
        className={`text-xs transition-colors ${
          value
            ? "text-slate-500 hover:text-slate-700"
            : "text-slate-300 hover:text-slate-500"
        }`}
      >
        {value || placeholder}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
    />
  );
}
