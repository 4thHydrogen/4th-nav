import { useMemo, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  buildLayout,
  compactLayout,
  moveItem,
  resizeLayoutItem,
  type LayoutSourceItem,
} from "../../features/grid-layout/model/layout";
import { gridToPixels, pixelsToGrid } from "../../features/grid-layout/model/geometry";
import type { GridLayout } from "../../features/grid-layout/model/collision";
import type { PanelItem } from "../../entities/panel/types";

export type { GridLayout };
export type { LayoutSourceItem };
export { buildLayout, compactLayout, moveItem, resizeLayoutItem, gridToPixels, pixelsToGrid };

function toLayoutSourceItems(items: PanelItem[]): LayoutSourceItem[] {
  return items.map((item) => ({
    id: String(item.id),
    sort: item.sort,
    size: item.size,
    gridX: item.gridX,
    gridY: item.gridY,
  }));
}

export const BREAKPOINTS = { lg: 1100, md: 768, sm: 500, xs: 0 };
const RESPONSIVE_DEFAULTS: Record<string, number> = { lg: 12, md: 8, sm: 5, xs: 3 };

export function getBreakpoint(width: number): keyof typeof BREAKPOINTS {
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "xs";
}

function getCols(width: number, configured: number | null): number {
  const bp = getBreakpoint(width);
  if (configured != null && configured > 0) {
    if (bp === "lg") return configured;
    return Math.min(configured, RESPONSIVE_DEFAULTS[bp]);
  }
  return RESPONSIVE_DEFAULTS[bp];
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
  items: PanelItem[],
  config?: { columnsPerRow: number | null; gap: number; iconScale: number }
) {
  const { wrapperRef, gridRef, width } = useContainerWidth();
  const gap = config?.gap ?? 12;
  const iconScale = config?.iconScale ?? 0.62;
  const cols = getCols(width, config?.columnsPerRow ?? null);
  const cellSize = cols > 0 ? (width - (cols - 1) * gap) / cols : 0;
  const rowHeight = cellSize;
  const cellWidth = cellSize;
  const iconSize = cellSize * iconScale;
  const margin: [number, number] = [gap, gap];

  const prevItemsRef = useRef<PanelItem[]>([]);
  const currentLayoutRef = useRef<GridLayout[]>([]);

  const initialLayout = useMemo(() => {
    if (width <= 0) return [];

    const prev = prevItemsRef.current;
    if (prev.length === items.length && prev.length > 0 && currentLayoutRef.current.length > 0) {
      let changedId: string | null = null;
      let changedW = 0;
      let changedH = 0;
      let onlySizeChange = true;

      const prevMap = new Map(prev.map((item) => [item.id, item]));
      for (const item of items) {
        const previous = prevMap.get(item.id);
        if (!previous) {
          onlySizeChange = false;
          break;
        }
        if (previous.size !== item.size) {
          if (changedId !== null) {
            onlySizeChange = false;
            break;
          }
          changedId = String(item.id);
          [changedW, changedH] = item.size.split("x").map(Number) as [number, number];
        }
        if (
          previous.gridX !== item.gridX ||
          previous.gridY !== item.gridY ||
          previous.sort !== item.sort ||
          previous.kind !== item.kind
        ) {
          onlySizeChange = false;
          break;
        }
      }

      if (onlySizeChange && changedId) {
        return resizeLayoutItem(currentLayoutRef.current, changedId, changedW, changedH, cols);
      }
    }

    prevItemsRef.current = items;
    return buildLayout(toLayoutSourceItems(items), cols);
  }, [items, cols, width]);

  const [layout, setLayout] = useState<GridLayout[]>([]);
  currentLayoutRef.current = layout;

  const prevLayoutKeyRef = useRef("");

  useLayoutEffect(() => {
    prevItemsRef.current = items;
    const key = initialLayout.map((item) => `${item.i}:${item.x},${item.y},${item.w},${item.h}`).join("|");
    if (key === prevLayoutKeyRef.current) return;
    prevLayoutKeyRef.current = key;
    setLayout(initialLayout);
  }, [initialLayout, items]);

  const totalHeight = useMemo(() => {
    if (layout.length === 0) return 200;
    const maxY = Math.max(...layout.map((item) => item.y + item.h));
    return maxY * (rowHeight + margin[1]) + margin[1];
  }, [layout, rowHeight, margin]);

  return {
    layout,
    setLayout,
    wrapperRef,
    gridRef,
    width,
    cols,
    totalHeight,
    cellWidth,
    isReady: width > 0,
    rowHeight,
    margin,
    iconSize,
  };
}
