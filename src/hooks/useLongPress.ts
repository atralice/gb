import { useRef, useCallback } from "react";

type UseLongPressOptions = {
  onLongPress?: () => void;
  onPress?: () => void;
  threshold?: number;
};

export function useLongPress({
  onLongPress,
  onPress,
  threshold = 500,
}: UseLongPressOptions = {}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.stopPropagation();
      isLongPressRef.current = false;

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress?.();
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const cancel = useCallback((e?: React.TouchEvent | React.MouseEvent) => {
    e?.stopPropagation();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.stopPropagation();
      cancel();

      // Only trigger onPress if it wasn't a long press
      if (!isLongPressRef.current) {
        onPress?.();
      }
    },
    [cancel, onPress]
  );

  return {
    onTouchStart: start,
    onTouchEnd: end,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
  };
}
