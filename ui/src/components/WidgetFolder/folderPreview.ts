import type { Tool } from "../../types";

export interface PreviewSlot {
  type: "tool" | "summary" | "empty";
  tool?: Tool;
  tools?: Tool[];
  count?: number;
}

/**
 * Build stable preview slots for a collapsed folder.
 *
 * Rules:
 * - 1×1 folder: internal mini 2×2 grid, max 4 visual units.
 * - Larger folders: cols × rows slots.
 * - Overflow: last slot is a summary showing up to 3 mini icons + "+N" count.
 */
export function buildFolderPreviewSlots(
  children: Tool[],
  cols: number,
  rows: number,
): PreviewSlot[] {
  const totalSlots = cols * rows;
  const isSmall = totalSlots <= 1;

  // Small folders use an internal 2×2 mini grid
  const maxIcons = isSmall ? 4 : totalSlots;

  if (children.length === 0) {
    return isSmall
      ? [{ type: "empty" }, { type: "empty" }, { type: "empty" }, { type: "empty" }]
      : Array.from({ length: totalSlots }, () => ({ type: "empty" as const }));
  }

  // No overflow: all children fit
  if (children.length <= maxIcons) {
    const slots: PreviewSlot[] = children.map((tool) => ({ type: "tool" as const, tool }));
    while (slots.length < maxIcons) {
      slots.push({ type: "empty" });
    }
    return slots;
  }

  // Overflow: show first (maxIcons - 1) tools, last slot is summary
  const regularCount = maxIcons - 1;
  const slots: PreviewSlot[] = children
    .slice(0, regularCount)
    .map((tool) => ({ type: "tool" as const, tool }));

  const remaining = children.slice(regularCount);
  const extraCount = children.length - maxIcons;

  slots.push({
    type: "summary",
    tools: remaining,
    count: extraCount,
  });

  return slots;
}

/** Grid columns for the preview area */
export function previewGridCols(cols: number, rows: number): number {
  return cols * rows <= 1 ? 2 : cols;
}

/** Grid rows for the preview area */
export function previewGridRows(cols: number, rows: number): number {
  return cols * rows <= 1 ? 2 : rows;
}
