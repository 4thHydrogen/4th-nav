import { useRef, useCallback } from "react";

export const useDebounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
  const { current } = useRef<{ time: ReturnType<typeof setTimeout> | null }>({ time: null });
  return useCallback(
    (...args: Parameters<T>) => {
      if (current.time) {
        clearTimeout(current.time);
        current.time = null;
      }
      current.time = setTimeout(() => {
        fn(...args);
        clearTimeout(current.time);
        current.time = null;
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, delay]
  );
};
