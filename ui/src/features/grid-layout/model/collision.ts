export interface GridLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function overlaps(a: GridLayout, b: GridLayout): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

export function pushOverlapping(
  placed: GridLayout[],
  newItem: GridLayout,
  cols: number,
  visited = new Set<string>()
) {
  for (const item of placed) {
    if (visited.has(item.i)) continue;
    if (!overlaps(item, newItem)) continue;
    visited.add(item.i);
    const rightX = newItem.x + newItem.w;
    if (rightX + item.w <= cols) {
      item.x = rightX;
    } else {
      item.y = newItem.y + newItem.h;
      item.x = Math.min(item.x, cols - item.w);
    }
    pushOverlapping(placed, item, cols, visited);
  }
}
