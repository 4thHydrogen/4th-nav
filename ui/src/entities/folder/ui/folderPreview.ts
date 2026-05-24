import type { LinkItem } from "../../panel/types";

export interface PreviewSlot {
  type: "tool" | "summary" | "empty";
  item?: LinkItem;
  items?: LinkItem[];
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
  children: LinkItem[],
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
    const slots: PreviewSlot[] = children.map((item) => ({ type: "tool" as const, item }));
    while (slots.length < maxIcons) {
      slots.push({ type: "empty" });
    }
    return slots;
  }

  // Overflow: show first (maxIcons - 1) tools, last slot is summary
  const regularCount = maxIcons - 1;
  const slots: PreviewSlot[] = children
    .slice(0, regularCount)
    .map((item) => ({ type: "tool" as const, item }));

  const remaining = children.slice(regularCount);
  const extraCount = Math.max(0, remaining.length - 3);

  slots.push({
    type: "summary",
    items: remaining,
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
