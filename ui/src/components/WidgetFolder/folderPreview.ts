import type { Tool } from "../../types";

export interface PreviewSlot {
  type: "tool" | "overflow" | "empty";
  tool?: Tool;
  count?: number;
}

/**
 * Build stable preview slots for a collapsed folder.
 *
 * Rules:
 * - 1×1 folder: internal mini 2×2 grid, max 4 visual units. Overflow → last slot shows "+N".
 * - Larger folders: cols × rows slots. Overflow → last slot shows "+N".
 * - No real icon should squeeze past the slot limit.
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
    // Fill remaining with empty
    while (slots.length < maxIcons) {
      slots.push({ type: "empty" });
    }
    return slots;
  }

  // Overflow: show first (maxIcons - 1) tools, last slot is "+N"
  const slots: PreviewSlot[] = children
    .slice(0, maxIcons - 1)
    .map((tool) => ({ type: "tool" as const, tool }));

  slots.push({
    type: "overflow",
    count: children.length - (maxIcons - 1),
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
