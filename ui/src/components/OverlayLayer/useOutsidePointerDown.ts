import { useEffect, useCallback, type RefObject } from "react";

export function useOutsidePointerDown(
  ref: RefObject<HTMLElement | null>,
  handler: (e: PointerEvent) => void,
  enabled: boolean = true,
) {
  const stableHandler = useCallback(handler, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      stableHandler(e);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [ref, stableHandler, enabled]);
}
