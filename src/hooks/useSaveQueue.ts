"use client";

import { useRef, useState, useCallback, useEffect } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "timestamp";

export function useSaveQueue(debounceMs = 800) {
  const pending = useRef(new Map<string, () => Promise<void>>());
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timestampTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const runFlush = useCallback(async () => {
    const fns = Array.from(pending.current.values());
    pending.current.clear();
    if (fns.length === 0) return;

    setStatus("saving");
    await Promise.allSettled(fns.map((fn) => fn()));
    setStatus("saved");
    setLastSavedAt(new Date());

    if (timestampTimerRef.current) clearTimeout(timestampTimerRef.current);
    timestampTimerRef.current = setTimeout(() => setStatus("timestamp"), 2000);
  }, []);

  const enqueue = useCallback(
    (key: string, saveFn: () => Promise<void>) => {
      pending.current.set(key, saveFn);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void runFlush(), debounceMs);
    },
    [debounceMs, runFlush]
  );

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void runFlush();
  }, [runFlush]);

  // Flush on unmount (fire-and-forget)
  useEffect(() => {
    const pendingRef = pending.current;
    const timer = timerRef;
    const tsTimer = timestampTimerRef;
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (tsTimer.current) clearTimeout(tsTimer.current);
      const fns = Array.from(pendingRef.values());
      if (fns.length > 0) {
        void Promise.allSettled(fns.map((fn) => fn()));
      }
    };
  }, []);

  return { enqueue, flush, status, lastSavedAt };
}
