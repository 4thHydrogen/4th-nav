import { pushOverlapping, overlaps, type GridLayout } from "./collision";

export interface LayoutSourceItem {
  id: string;
  sort: number;
  size: string;
  gridX: number;
  gridY: number;
}

const parseToolSize = (size: string): [number, number] => {
  const parts = size.split("x").map(Number);
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    return [parts[0], parts[1]];
  }
  return [1, 1];
};

export function autoLayout(items: LayoutSourceItem[], cols: number): GridLayout[] {
  const sorted = [...items].sort((a, b) => a.sort - b.sort);
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

  for (const item of sorted) {
    const [w, h] = parseToolSize(item.size);
    const pos = findPosition(w, h);
    layouts.push({ i: item.id, x: pos.x, y: pos.y, w, h });
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        occupied.add(`${pos.x + dx},${pos.y + dy}`);
      }
    }
  }

  return layouts;
}

export function buildLayout(items: LayoutSourceItem[], cols: number): GridLayout[] {
  const hasPositions = items.some((item) => item.gridX >= 0);
  if (!hasPositions) return autoLayout(items, cols);

  const positionedItems = items
    .filter((item) => item.gridX >= 0)
    .slice()
    .sort((a, b) => a.gridY - b.gridY || a.gridX - b.gridX);

  const placed: GridLayout[] = [];
  const occupied = new Set<string>();
  const occupy = (layout: GridLayout) => {
    placed.push(layout);
    for (let dy = 0; dy < layout.h; dy++) {
      for (let dx = 0; dx < layout.w; dx++) {
        occupied.add(`${layout.x + dx},${layout.y + dy}`);
      }
    }
  };

  for (const item of positionedItems) {
    const [w, h] = parseToolSize(item.size);
    let x = Math.max(item.gridX, 0);
    let y = Math.max(item.gridY, 0);

    if (x + w > cols) x = 0;

    const probe: GridLayout = { i: item.id, x, y, w, h };
    pushOverlapping(placed, probe, cols);

    while (placed.some((existing) => overlaps(existing, probe))) {
      probe.y++;
    }

    occupy(probe);
  }

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

  const newItems = items
    .filter((item) => item.gridX < 0)
    .slice()
    .sort((a, b) => a.sort - b.sort);

  for (const item of newItems) {
    const [w, h] = parseToolSize(item.size);
    const pos = findEmptyPos(w, h);
    occupy({ i: item.id, x: pos.x, y: pos.y, w, h });
  }

  return placed;
}

export function resizeLayoutItem(
  items: GridLayout[],
  itemId: string,
  nextW: number,
  nextH: number,
  cols: number
): GridLayout[] {
  const current = items.find((item) => item.i === itemId);
  if (!current) return items;

  const resized: GridLayout = {
    ...current,
    w: nextW,
    h: nextH,
    x: Math.min(current.x, cols - nextW),
    y: current.y,
  };

  const others = items.filter((item) => item.i !== itemId).map((item) => ({ ...item }));
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

export function compactLayout(items: GridLayout[], _cols?: number): GridLayout[] {
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
  const active = items.find((item) => item.i === activeId);
  if (!active) return items;

  const clampedX = Math.max(0, Math.min(targetX, cols - active.w));
  const clampedY = Math.max(0, targetY);
  const moved = { ...active, x: clampedX, y: clampedY };
  const others = items.filter((item) => item.i !== activeId).map((item) => ({ ...item }));

  pushOverlapping(others, moved, cols);

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

  return [moved, ...others];
}
