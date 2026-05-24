import type { GridLayout } from "./collision";

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
  const x = Math.round((clientX - containerRect.left) / (cellWidth + margin[0]));
  const y = Math.round((clientY - containerRect.top) / (rowHeight + margin[1]));
  return {
    x: Math.max(0, Math.min(x, cols - itemW)),
    y: Math.max(0, y),
  };
}
