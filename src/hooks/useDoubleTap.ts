import { useRef, useCallback } from "react";

type UseDoubleTapOptions = {
  onSingleTap?: () => void;
  onDoubleTap?: () => void;
  delay?: number;
};

export function useDoubleTap({
  onSingleTap,
  onDoubleTap,
  delay = 250,
}: UseDoubleTapOptions = {}) {
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);

  const handleTap = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      tapCountRef.current += 1;

      if (tapCountRef.current === 1) {
        tapTimeoutRef.current = setTimeout(() => {
          if (tapCountRef.current === 1) {
            onSingleTap?.();
          }
          tapCountRef.current = 0;
        }, delay);
      } else if (tapCountRef.current === 2) {
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
        tapCountRef.current = 0;
        onDoubleTap?.();
      }
    },
    [onSingleTap, onDoubleTap, delay]
  );

  return { handleTap };
}
