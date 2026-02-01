"use client";

import { useState, useTransition, useCallback } from "react";

type UseEditableFieldOptions<T> = {
  initialValue: T;
  onSave: (value: T) => Promise<void>;
};

export function useEditableField<T>({
  initialValue,
  onSave,
}: UseEditableFieldOptions<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<T>(initialValue);
  const [isPending, startTransition] = useTransition();

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const cancel = useCallback(() => {
    setValue(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  const save = useCallback(() => {
    startTransition(async () => {
      await onSave(value);
      setIsEditing(false);
    });
  }, [value, onSave]);

  return {
    isEditing,
    isPending,
    value,
    setValue,
    startEditing,
    cancel,
    save,
  };
}
