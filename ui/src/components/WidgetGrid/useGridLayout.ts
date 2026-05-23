import { useMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Tool, LayoutItemDto } from "../../types";
import { fetchUpdateLayout } from "../../shared/api/tool";
import { parseSize } from "../WidgetTool";

export const BREAKPOINTS = { lg: 1100, md: 768, sm: 500, xs: 0 };
export const COLS = { lg: 12, md: 8, sm: 5, xs: 3 };
export const ROW_HEIGHT = 80;
export const MARGIN: readonly [number, number] = [12, 12];

function readGridVars(): { rowHeight: number; margin: [number, number] } {
  const el = document.querySelector(".desktop-page");
  if (!el) return { rowHeight: ROW_HEIGHT, margin: [...MARGIN] as [number, number] };
  const style = getComputedStyle(el);
  const rh = parseFloat(style.getPropertyValue("--row-height")) || ROW_HEIGHT;
  const gm = parseFloat(style.getPropertyValue("--grid-margin")) || MARGIN[0];
  return { rowHeight: rh, margin: [gm, gm] };
}

export interface GridLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getBreakpoint(width: number): keyof typeof COLS {
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "xs";
}

function autoLayout(tools: Tool[], cols: number): GridLayout[] {
  const sorted = [...tools].sort((a, b) => a.sort - b.sort);
  const occupied = new Set<string>();
  const layouts: GridLayout[] = [];

  const findPosition = (w: number, h: number): { x: number; y: number } => {
    for (let y = 0; ; y++) {
      for (let x = 0; x <= cols - w; x++) {
        let fits = true;
        for (let dy = 0; dy < h && fits; dy++) {
          for (let dx = 0; dx < w && fits; dx++) {
            if (occupied.has(`${x + dx},${y + dy}`)) fits = false;
          }
        }
        if (fits) return { x, y };
      }
    }
  };

  for (const tool of sorted) {
    const [w, h] = parseSize(tool.size);
    const pos = findPosition(w, h);
    layouts.push({ i: String(tool.id), x: pos.x, y: pos.y, w, h });
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        occupied.add(`${pos.x + dx},${pos.y + dy}`);
      }
    }
  }
  return layouts;
}

export function buildLayout(tools: Tool[], cols: number): GridLayout[] {
  const hasPositions = tools.some((t) => t.gridX >= 0);
  if (!hasPositions) {
    return autoLayout(tools, cols);
  }

  // 1. 已有位置的项按 (gridY, gridX) 升序优先放置
  const positionedTools = tools
    .filter((t) => t.gridX >= 0)
    .slice()
    .sort((a, b) => a.gridY - b.gridY || a.gridX - b.gridX);

  const placed: GridLayout[] = [];
  const occupied = new Set<string>();
  const occupy = (g: GridLayout) => {
    placed.push(g);
    for (let dy = 0; dy < g.h; dy++) {
      for (let dx = 0; dx < g.w; dx++) {
        occupied.add(`${g.x + dx},${g.y + dy}`);
      }
    }
  };

  for (const tool of positionedTools) {
    const [w, h] = parseSize(tool.size);
    let x = Math.max(tool.gridX, 0);
    let y = Math.max(tool.gridY, 0);

    // 如果宽度超出右边界，移到下一行开头
    if (x + w > cols) {
      x = 0;
    }

    const probe: GridLayout = { i: String(tool.id), x, y, w, h };

    // 将已放置的重叠项向右推（右到边界则下推）
    pushOverlapping(placed, probe, cols);

    // 如果 probe 自身与推后的项仍有重叠（极端情况），下移 probe
    while (placed.some((p) => overlaps(p, probe))) {
      probe.y++;
    }

    occupy(probe);
  }

  // 2. 新项（gridX < 0）按 sort 顺序找空位放置
  const findEmptyPos = (w: number, h: number): { x: number; y: number } => {
    for (let y = 0; ; y++) {
      for (let x = 0; x <= cols - w; x++) {
        let fits = true;
        for (let dy = 0; dy < h && fits; dy++) {
          for (let dx = 0; dx < w && fits; dx++) {
            if (occupied.has(`${x + dx},${y + dy}`)) fits = false;
          }
        }
        if (fits) return { x, y };
      }
    }
  };

  const newTools = tools
    .filter((t) => t.gridX < 0)
    .slice()
    .sort((a, b) => a.sort - b.sort);

  for (const tool of newTools) {
    const [w, h] = parseSize(tool.size);
    const pos = findEmptyPos(w, h);
    occupy({ i: String(tool.id), x: pos.x, y: pos.y, w, h });
  }

  return placed;
}

function overlaps(a: GridLayout, b: GridLayout): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

/**
 * 将 placed 中与 newItem 重叠的项向右推；右侧到边界则向下推。
 * 递归处理级联碰撞。
 */
function pushOverlapping(
  placed: GridLayout[],
  newItem: GridLayout,
  cols: number,
  visited = new Set<string>()
) {
  for (const item of placed) {
    if (visited.has(item.i)) continue;
    if (!overlaps(item, newItem)) continue;
    visited.add(item.i);
    // 优先右推
    const rightX = newItem.x + newItem.w;
    if (rightX + item.w <= cols) {
      item.x = rightX;
    } else {
      // 右推到边界 → 下推
      item.y = newItem.y + newItem.h;
      item.x = Math.min(item.x, cols - item.w);
    }
    // 级联：被推的项可能又与其他项重叠
    pushOverlapping(placed, item, cols, visited);
  }
}

/**
 * Anchor resize: the resized item keeps its x/y, only w/h changes.
 * Other items are pushed to resolve overlaps, but the anchor never moves.
 */
export function resizeLayoutItem(
  items: GridLayout[],
  itemId: string,
  nextW: number,
  nextH: number,
  cols: number
): GridLayout[] {
  const current = items.find((i) => i.i === itemId);
  if (!current) return items;

  const resized: GridLayout = {
    ...current,
    w: nextW,
    h: nextH,
    x: Math.min(current.x, cols - nextW),
    y: current.y,
  };

  const others: GridLayout[] = items
    .filter((i) => i.i !== itemId)
    .map((i) => ({ ...i }));

  pushOverlapping(others, resized, cols);

  for (let round = 0; round < others.length * 2; round++) {
    let dirty = false;
    for (let i = 0; i < others.length; i++) {
      for (let j = i + 1; j < others.length; j++) {
        if (overlaps(others[i], others[j])) {
          const rightX = others[i].x + others[i].w;
          if (rightX + others[j].w <= cols) {
            others[j].x = rightX;
          } else {
            others[j].y = others[i].y + others[i].h;
            others[j].x = Math.min(others[j].x, cols - others[j].w);
          }
          dirty = true;
        }
      }
    }
    if (!dirty) break;
  }

  return [resized, ...others];
}

export function compactLayout(items: GridLayout[], cols: number): GridLayout[] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const occupied = new Set<string>();

  const place = (item: GridLayout): GridLayout => {
    for (let y = 0; ; y++) {
      let fits = true;
      for (let dy = 0; dy < item.h && fits; dy++) {
        for (let dx = 0; dx < item.w && fits; dx++) {
          if (occupied.has(`${item.x + dx},${y + dy}`)) fits = false;
        }
      }
      if (fits) {
        const placed = { ...item, y };
        for (let dy = 0; dy < item.h; dy++) {
          for (let dx = 0; dx < item.w; dx++) {
            occupied.add(`${placed.x + dx},${placed.y + dy}`);
          }
        }
        return placed;
      }
    }
  };

  return sorted.map(place);
}

export function moveItem(
  items: GridLayout[],
  activeId: string,
  targetX: number,
  targetY: number,
  cols: number
): GridLayout[] {
  const active = items.find((i) => i.i === activeId);
  if (!active) return items;

  const clampedX = Math.max(0, Math.min(targetX, cols - active.w));
  const clampedY = Math.max(0, targetY);
  const moved = { ...active, x: clampedX, y: clampedY };

  const others: GridLayout[] = items
    .filter((i) => i.i !== activeId)
    .map((i) => ({ ...i }));

  // 将与 moved 重叠的其他项向右推（右到边界则下推）
  pushOverlapping(others, moved, cols);

  // 处理 others 之间因级联推挤可能产生的重叠：多轮修正
  for (let round = 0; round < others.length * 2; round++) {
    let dirty = false;
    for (let i = 0; i < others.length; i++) {
      for (let j = i + 1; j < others.length; j++) {
        if (overlaps(others[i], others[j])) {
          // 把 j 向右推
          const rightX = others[i].x + others[i].w;
          if (rightX + others[j].w <= cols) {
            others[j].x = rightX;
          } else {
            others[j].y = others[i].y + others[i].h;
            others[j].x = Math.min(others[j].x, cols - others[j].w);
          }
          dirty = true;
        }
      }
    }
    if (!dirty) break;
  }

  return [moved, ...others];
}

export function gridToPixels(
  layout: GridLayout,
  containerWidth: number,
  cols: number,
  rowHeight: number,
  margin: [number, number]
): { left: number; top: number; width: number; height: number } {
  const cellWidth = (containerWidth - (cols - 1) * margin[0]) / cols;
  return {
    left: layout.x * (cellWidth + margin[0]),
    top: layout.y * (rowHeight + margin[1]),
    width: layout.w * cellWidth + (layout.w - 1) * margin[0],
    height: layout.h * rowHeight + (layout.h - 1) * margin[1],
  };
}

export function pixelsToGrid(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  itemW: number,
  cols: number,
  rowHeight: number,
  margin: [number, number]
): { x: number; y: number } {
  const cellWidth = (containerRect.width - (cols - 1) * margin[0]) / cols;
  // 边界设在两个网格位置的中点：round 自然将切换点放在 pitch/2
  const x = Math.round((clientX - containerRect.left) / (cellWidth + margin[0]));
  const y = Math.round((clientY - containerRect.top) / (rowHeight + margin[1]));
  return {
    x: Math.max(0, Math.min(x, cols - itemW)),
    y: Math.max(0, y),
  };
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

export function useGridLayout(tools: Tool[]) {
  const { wrapperRef, gridRef, width } = useContainerWidth();
  const bp = getBreakpoint(width);
  const cols = COLS[bp];

  const { rowHeight, margin } = useMemo(readGridVars, [tools, width]);

  const prevToolsRef = useRef<Tool[]>([]);
  const currentLayoutRef = useRef<GridLayout[]>([]);

  const initialLayout = useMemo(() => {
    if (width <= 0) return [];

    // Detect single-item size change → use anchor resize
    const prev = prevToolsRef.current;
    if (prev.length === tools.length && prev.length > 0 && currentLayoutRef.current.length > 0) {
      let changedId: string | null = null;
      let changedW = 0;
      let changedH = 0;
      let onlySizeChange = true;

      const prevMap = new Map(prev.map((t) => [t.id, t]));
      for (const t of tools) {
        const p = prevMap.get(t.id);
        if (!p) { onlySizeChange = false; break; }
        if (p.size !== t.size) {
          if (changedId !== null) { onlySizeChange = false; break; }
          changedId = String(t.id);
          [changedW, changedH] = parseSize(t.size);
        }
        if (p.gridX !== t.gridX || p.gridY !== t.gridY || p.sort !== t.sort || p.type !== t.type) {
          onlySizeChange = false;
          break;
        }
      }

      if (onlySizeChange && changedId) {
        return resizeLayoutItem(currentLayoutRef.current, changedId, changedW, changedH, cols);
      }
    }

    prevToolsRef.current = tools;
    return buildLayout(tools, cols);
  }, [tools, cols, width]);

  const [layout, setLayout] = useState<GridLayout[]>([]);
  currentLayoutRef.current = layout;

  const prevLayoutKeyRef = useRef("");

  useLayoutEffect(() => {
    prevToolsRef.current = tools;
    const key = initialLayout
      .map((i) => `${i.i}:${i.x},${i.y},${i.w},${i.h}`)
      .join("|");
    if (key === prevLayoutKeyRef.current) return;
    prevLayoutKeyRef.current = key;
    setLayout(initialLayout);
  }, [initialLayout]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>("");

  const saveLayout = useCallback((items: GridLayout[]) => {
    const snapshot = JSON.stringify(items);
    if (snapshot === lastSaved.current) return;
    lastSaved.current = snapshot;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const dto: LayoutItemDto[] = items.map((l) => ({
        id: Number(l.i),
        gridX: l.x,
        gridY: l.y,
        w: l.w,
        h: l.h,
      }));
      fetchUpdateLayout(dto).catch((err) => {
        console.error("Failed to save layout:", err);
      });
    }, 500);
  }, []);

  // 窄屏下，原始 gridX 可能被 clamp（视觉上挤到右侧/纵向堆叠）。
  // 此模式下绝对不能 save — 否则窄屏的 clamp 会污染宽屏的 DB 位置。
  const isClampMode = useMemo(() => {
    const maxOriginalGridX = tools.reduce(
      (m, t) => Math.max(m, t.gridX >= 0 ? t.gridX : -1),
      -1
    );
    return maxOriginalGridX >= 0 && maxOriginalGridX >= cols;
  }, [tools, cols]);

  const updateLayout = useCallback(
    (next: GridLayout[]) => {
      setLayout(next);
      // 仅当不在 clamp 模式下才持久化
      if (!isClampMode) saveLayout(next);
    },
    [saveLayout, isClampMode]
  );

  const cellWidth = cols > 0 ? (width - (cols - 1) * margin[0]) / cols : 0;

  const totalHeight = useMemo(() => {
    if (layout.length === 0) return 200;
    const maxY = Math.max(...layout.map((l) => l.y + l.h));
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
