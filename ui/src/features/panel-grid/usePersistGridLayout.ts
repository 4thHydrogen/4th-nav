import { useCallback, useRef } from "react";
import type { LayoutItemDto } from "../../types";
import { fetchUpdateLayout } from "../../shared/api/tool";
import type { GridLayout } from "./useGridLayout";

const DEBOUNCE_MS = 500;

export function usePersistGridLayout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef("");

  const persist = useCallback((layout: GridLayout[]) => {
    const snapshot = JSON.stringify(layout);
    if (snapshot === lastSavedRef.current) return;
    lastSavedRef.current = snapshot;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const dto: LayoutItemDto[] = layout.map((item) => ({
        id: Number(item.i),
        gridX: item.x,
        gridY: item.y,
        w: item.w,
        h: item.h,
      }));
      fetchUpdateLayout(dto).catch((err) => {
        console.error("Failed to save layout:", err);
      });
    }, DEBOUNCE_MS);
  }, []);

  return { persist };
}
