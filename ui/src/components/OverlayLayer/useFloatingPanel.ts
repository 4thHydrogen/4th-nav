import { useCallback, useRef, useState } from "react";
import { useOverlayActivity } from "./OverlayProvider";

export type OverlayPhase = "closed" | "opening" | "open" | "closing";

export interface FloatingPanelState {
  phase: OverlayPhase;
  anchorRect: DOMRectReadOnly | null;
  instanceId: number;
}

const INITIAL_STATE: FloatingPanelState = {
  phase: "closed",
  anchorRect: null,
  instanceId: 0,
};

export function useFloatingPanel() {
  const [state, setState] = useState<FloatingPanelState>(INITIAL_STATE);
  const registerActivity = useOverlayActivity();
  const unregisterRef = useRef<(() => void) | null>(null);

  const open = useCallback(
    (anchorRect: DOMRectReadOnly) => {
      if (!unregisterRef.current) {
        unregisterRef.current = registerActivity();
      }
      setState((prev) => ({
        phase: "opening",
        anchorRect,
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
    setState((prev) => {
      if (prev.phase === "closing") return INITIAL_STATE;
      return prev;
    });
  }, []);

  const toggle = useCallback(
    (anchorRect: DOMRectReadOnly) => {
      setState((prev) => {
        if (prev.phase === "closed" || prev.phase === "closing") {
          if (!unregisterRef.current) {
            unregisterRef.current = registerActivity();
          }
          return {
            phase: "opening",
            anchorRect,
            instanceId: prev.instanceId + 1,
          };
        }
        // Already open/opening → close
        return { ...prev, phase: "closing" };
      });
    },
    [registerActivity],
  );

  const isOpen = state.phase !== "closed";

  return { state, open, markOpen, close, markClosed, toggle, isOpen };
}
