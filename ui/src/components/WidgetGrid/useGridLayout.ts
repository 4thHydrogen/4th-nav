import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import type { Tool, LayoutItemDto } from "../../types";
import { fetchUpdateLayout } from "../../utils/api";
import { parseSize } from "../WidgetTool";

export const BREAKPOINTS = { lg: 1100, md: 768, sm: 500, xs: 0 };
export const COLS = { lg: 12, md: 8, sm: 5, xs: 3 };
export const ROW_HEIGHT = 80;
export const MARGIN: readonly [number, number] = [12, 12];

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

  // 1. 已有位置的项按 (gridY, gridX) 升序优先放置；冲突时向下找空位
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
    const baseX = Math.min(Math.max(tool.gridX, 0), cols - w);
    let y = Math.max(tool.gridY, 0);
    let probe: GridLayout = { i: String(tool.id), x: baseX, y, w, h };
    while (placed.some((p) => overlaps(p, probe))) {
      y++;
      probe = { i: String(tool.id), x: baseX, y, w, h };
    }
    occupy(probe);
  }

  // 2. 新项（gridX < 0）按 sort 顺序找空位放置 — 避免多个新项被堆到 (0,0) 挤压成单列
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

  // 保留其他项的原位置；仅当发生碰撞时将被碰撞项下移
  const result: GridLayout[] = [moved];
  const queue: GridLayout[] = items
    .filter((i) => i.i !== activeId)
    .map((i) => ({ ...i }));

  while (queue.length > 0) {
    const item = queue.shift()!;
    let conflict = result.find((r) => overlaps(r, item));
    if (!conflict) {
      result.push(item);
      continue;
    }
    // 把碰撞项推到下方第一个不重叠的位置（保持 x 不变）
    let newY = item.y;
    while (true) {
      newY++;
      const probe = { ...item, y: newY };
      conflict = result.find((r) => overlaps(r, probe));
      if (!conflict) {
        result.push(probe);
        break;
      }
    }
  }

  return result;
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

  const initialLayout = useMemo(
    // width=0 时（ResizeObserver 还没回调，cols=3 是退化值），跳过 buildLayout
    // 避免基于错误 cols 计算出"全部挤到 x ∈ {0,1,2}"的退化布局
    () => (width > 0 ? buildLayout(tools, cols) : []),
    [tools, cols, width]
  );

  const [layout, setLayout] = useState<GridLayout[]>(initialLayout);

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

  // 仅在 initialLayout 变化时同步 state — 不再做"drift 检测 + autoSave"，
  // 那会在 width=0 / cols=3 的退化首帧把错误布局写盘，永久毁掉用户位置。
  // 持久化只发生在用户主动拖拽 (updateLayout) 时。
  useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout]);

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

  const cellWidth = cols > 0 ? (width - (cols - 1) * MARGIN[0]) / cols : 0;

  const totalHeight = useMemo(() => {
    if (layout.length === 0) return 200;
    const maxY = Math.max(...layout.map((l) => l.y + l.h));
    return maxY * (ROW_HEIGHT + MARGIN[1]) + MARGIN[1];
  }, [layout]);

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
  };
}
