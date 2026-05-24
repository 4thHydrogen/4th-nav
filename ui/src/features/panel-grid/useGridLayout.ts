import { useMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LayoutItemDto, Tool } from "../../types";
import { fetchUpdateLayout } from "../../shared/api/tool";
import {
  buildLayout,
  compactLayout,
  moveItem,
  resizeLayoutItem,
  type LayoutSourceItem,
} from "../../features/grid-layout/model/layout";
import { gridToPixels, pixelsToGrid } from "../../features/grid-layout/model/geometry";
import type { GridLayout } from "../../features/grid-layout/model/collision";

export type { GridLayout };
export type { LayoutSourceItem };
export { buildLayout, compactLayout, moveItem, resizeLayoutItem, gridToPixels, pixelsToGrid };

function toLayoutSourceItems(tools: Tool[]): LayoutSourceItem[] {
  return tools.map((tool) => ({
    id: String(tool.id),
    sort: tool.sort,
    size: tool.size,
    gridX: tool.gridX,
    gridY: tool.gridY,
  }));
}

export const BREAKPOINTS = { lg: 1100, md: 768, sm: 500, xs: 0 };
export const COLS = { lg: 12, md: 8, sm: 5, xs: 3 };
export const ROW_HEIGHT = 80;
export const MARGIN: readonly [number, number] = [12, 12];

export function getBreakpoint(width: number): keyof typeof COLS {
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "xs";
}

export function useContainerWidth() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { wrapperRef, gridRef, width };
}

export function useGridLayout(
  tools: Tool[],
  config?: { rowHeight: number; margin: [number, number] }
) {
  const { wrapperRef, gridRef, width } = useContainerWidth();
  const bp = getBreakpoint(width);
  const cols = COLS[bp];
  const rowHeight = config?.rowHeight ?? ROW_HEIGHT;
  const margin: [number, number] = config?.margin ?? [...MARGIN] as [number, number];

  const prevToolsRef = useRef<Tool[]>([]);
  const currentLayoutRef = useRef<GridLayout[]>([]);

  const initialLayout = useMemo(() => {
    if (width <= 0) return [];

    const prev = prevToolsRef.current;
    if (prev.length === tools.length && prev.length > 0 && currentLayoutRef.current.length > 0) {
      let changedId: string | null = null;
      let changedW = 0;
      let changedH = 0;
      let onlySizeChange = true;

      const prevMap = new Map(prev.map((tool) => [tool.id, tool]));
      for (const tool of tools) {
        const previous = prevMap.get(tool.id);
        if (!previous) {
          onlySizeChange = false;
          break;
        }
        if (previous.size !== tool.size) {
          if (changedId !== null) {
            onlySizeChange = false;
            break;
          }
          changedId = String(tool.id);
          [changedW, changedH] = tool.size.split("x").map(Number) as [number, number];
        }
        if (
          previous.gridX !== tool.gridX ||
          previous.gridY !== tool.gridY ||
          previous.sort !== tool.sort ||
          previous.type !== tool.type
        ) {
          onlySizeChange = false;
          break;
        }
      }

      if (onlySizeChange && changedId) {
        return resizeLayoutItem(currentLayoutRef.current, changedId, changedW, changedH, cols);
      }
    }

    prevToolsRef.current = tools;
    return buildLayout(toLayoutSourceItems(tools), cols);
  }, [tools, cols, width]);

  const [layout, setLayout] = useState<GridLayout[]>([]);
  currentLayoutRef.current = layout;

  const prevLayoutKeyRef = useRef("");

  useLayoutEffect(() => {
    prevToolsRef.current = tools;
    const key = initialLayout.map((item) => `${item.i}:${item.x},${item.y},${item.w},${item.h}`).join("|");
    if (key === prevLayoutKeyRef.current) return;
    prevLayoutKeyRef.current = key;
    setLayout(initialLayout);
  }, [initialLayout, tools]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef("");

  const saveLayout = useCallback((items: GridLayout[]) => {
    const snapshot = JSON.stringify(items);
    if (snapshot === lastSaved.current) return;
    lastSaved.current = snapshot;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const dto: LayoutItemDto[] = items.map((item) => ({
        id: Number(item.i),
        gridX: item.x,
        gridY: item.y,
        w: item.w,
        h: item.h,
      }));
      fetchUpdateLayout(dto).catch((err) => {
        console.error("Failed to save layout:", err);
      });
    }, 500);
  }, []);

  const isClampMode = useMemo(() => {
    const maxOriginalGridX = tools.reduce(
      (maxValue, tool) => Math.max(maxValue, tool.gridX >= 0 ? tool.gridX : -1),
      -1
    );
    return maxOriginalGridX >= 0 && maxOriginalGridX >= cols;
  }, [tools, cols]);

  const updateLayout = useCallback(
    (next: GridLayout[]) => {
      setLayout(next);
      if (!isClampMode) saveLayout(next);
    },
    [saveLayout, isClampMode]
  );

  const cellWidth = cols > 0 ? (width - (cols - 1) * margin[0]) / cols : 0;
  const totalHeight = useMemo(() => {
    if (layout.length === 0) return 200;
    const maxY = Math.max(...layout.map((item) => item.y + item.h));
    return maxY * (rowHeight + margin[1]) + margin[1];
  }, [layout, rowHeight, margin]);

  return {
    layout,
    setLayout,
    updateLayout,
    wrapperRef,
    gridRef,
    width,
    cols,
    totalHeight,
    cellWidth,
    isReady: width > 0,
    isClampMode,
    rowHeight,
    margin,
  };
}
