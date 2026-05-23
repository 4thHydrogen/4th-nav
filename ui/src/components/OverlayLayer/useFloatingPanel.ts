import { useCallback, useRef, useState } from "react";
import { useOverlayActivity } from "./OverlayProvider";

export type OverlayPhase = "closed" | "opening" | "open" | "closing";

export interface FloatingPanelState<T = void> {
  phase: OverlayPhase;
  anchorRect: DOMRectReadOnly | null;
  payload: T | null;
  instanceId: number;
}

const INITIAL_STATE = {
  phase: "closed" as OverlayPhase,
  anchorRect: null as DOMRectReadOnly | null,
  payload: null as unknown,
  instanceId: 0,
};

export function useFloatingPanel<T = void>() {
  const [state, setState] = useState<FloatingPanelState<T>>(INITIAL_STATE as FloatingPanelState<T>);
  const registerActivity = useOverlayActivity();
  const unregisterRef = useRef<(() => void) | null>(null);

  const open = useCallback(
    (anchorRect: DOMRectReadOnly, payload: T) => {
      if (!unregisterRef.current) {
        unregisterRef.current = registerActivity();
      }
      setState((prev) => ({
        phase: "opening",
        anchorRect,
        payload,
        instanceId: prev.instanceId + 1,
      }));
    },
    [registerActivity],
  );

  const markOpen = useCallback(() => {
    setState((prev) =>
      prev.phase === "opening" ? { ...prev, phase: "open" } : prev,
    );
  }, []);

  const close = useCallback(() => {
    setState((prev) => {
      if (prev.phase === "closed" || prev.phase === "closing") return prev;
      return { ...prev, phase: "closing" };
    });
  }, []);

  const markClosed = useCallback(() => {
    if (unregisterRef.current) {
      unregisterRef.current();
      unregisterRef.current = null;
    }
    setState(INITIAL_STATE as FloatingPanelState<T>);
  }, []);

  const toggle = useCallback(
    (anchorRect: DOMRectReadOnly, payload: T) => {
      setState((prev) => {
        if (prev.phase === "closed" || prev.phase === "closing") {
          if (!unregisterRef.current) {
            unregisterRef.current = registerActivity();
          }
          return {
            phase: "opening",
            anchorRect,
            payload,
            instanceId: prev.instanceId + 1,
          };
        }
        // Already open/opening with same payload → close
        if (prev.payload === payload) {
          return { ...prev, phase: "closing" };
        }
        // Different payload → switch to new one
        return {
          phase: "opening",
          anchorRect,
          payload,
          instanceId: prev.instanceId + 1,
        };
      });
    },
    [registerActivity],
  );

  const isOpen = state.phase !== "closed";

  return { state, open, markOpen, close, markClosed, toggle, isOpen };
}
