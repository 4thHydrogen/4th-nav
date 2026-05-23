import { describe, it, expect } from "vitest";
import {
  BREAKPOINTS,
  COLS,
  ROW_HEIGHT,
  MARGIN,
  getBreakpoint,
  compactLayout,
  moveItem,
  gridToPixels,
  pixelsToGrid,
  buildLayout,
} from "../components/WidgetGrid/useGridLayout";
import type { GridLayout } from "../components/WidgetGrid/useGridLayout";
import type { Tool, ToolSize } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRect(
  left: number,
  top: number,
  width: number,
  height: number
): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

/** Shorthand to create a grid layout item. */
function item(
  id: string,
  x: number,
  y: number,
  w = 1,
  h = 1
): GridLayout {
  return { i: id, x, y, w, h };
}

// ===========================================================================
// getBreakpoint
// ===========================================================================
describe("getBreakpoint", () => {
  it("returns 'xs' for width 0", () => {
    expect(getBreakpoint(0)).toBe("xs");
  });

  it("returns 'xs' for width just below sm boundary", () => {
    expect(getBreakpoint(499)).toBe("xs");
  });

  it("returns 'sm' at the exact sm boundary (500)", () => {
    expect(getBreakpoint(500)).toBe("sm");
  });

  it("returns 'sm' just below md boundary", () => {
    expect(getBreakpoint(767)).toBe("sm");
  });

  it("returns 'md' at the exact md boundary (768)", () => {
    expect(getBreakpoint(768)).toBe("md");
  });

  it("returns 'md' just below lg boundary", () => {
    expect(getBreakpoint(1099)).toBe("md");
  });

  it("returns 'lg' at the exact lg boundary (1100)", () => {
    expect(getBreakpoint(1100)).toBe("lg");
  });

  it("returns 'lg' for large widths", () => {
    expect(getBreakpoint(2000)).toBe("lg");
  });
});

// ===========================================================================
// compactLayout
// ===========================================================================
describe("compactLayout", () => {
  it("returns empty array for empty input", () => {
    expect(compactLayout([], COLS.lg)).toEqual([]);
  });

  it("leaves a single item at (0,0) unchanged", () => {
    const result = compactLayout([item("a", 0, 0)], COLS.lg);
    expect(result).toEqual([item("a", 0, 0)]);
  });

  it("compacts a single item with a gap down to y=0", () => {
    const result = compactLayout([item("a", 0, 5)], COLS.lg);
    expect(result).toEqual([item("a", 0, 0)]);
  });

  it("compacts items with gaps vertically", () => {
    const input = [item("a", 0, 3), item("b", 0, 7)];
    const result = compactLayout(input, COLS.lg);
    // Both should be stacked at x=0, starting from y=0
    expect(result[0]).toEqual(item("a", 0, 0));
    expect(result[1]).toEqual(item("b", 0, 1));
  });

  it("preserves x positions and only reduces y", () => {
    const input = [item("a", 4, 10), item("b", 8, 20)];
    const result = compactLayout(input, COLS.lg);
    expect(result[0].x).toBe(4);
    expect(result[0].y).toBe(0);
    expect(result[1].x).toBe(8);
    expect(result[1].y).toBe(0);
  });

  it("does not produce overlapping items", () => {
    const input = [
      item("a", 0, 0),
      item("b", 0, 0), // same position as a
    ];
    const result = compactLayout(input, COLS.lg);
    // b should be pushed down below a
    expect(result[0]).toEqual(item("a", 0, 0));
    expect(result[1]).toEqual(item("b", 0, 1));
  });

  it("respects cols boundary — items don't exceed column count", () => {
    const cols = 3;
    const input = [
      item("a", 0, 0, 1, 1),
      item("b", 1, 0, 1, 1),
      item("c", 2, 0, 1, 1),
      item("d", 0, 5, 1, 1),
    ];
    const result = compactLayout(input, cols);
    for (const it of result) {
      expect(it.x + it.w).toBeLessThanOrEqual(cols);
    }
  });

  it("handles multi-cell items correctly without overlap", () => {
    const input = [
      item("a", 0, 0, 2, 1),
      item("b", 0, 5, 2, 1),
    ];
    const result = compactLayout(input, COLS.lg);
    expect(result[0]).toEqual(item("a", 0, 0, 2, 1));
    expect(result[1]).toEqual(item("b", 0, 1, 2, 1));
  });

  it("handles multi-row items pushing others further down", () => {
    const input = [
      item("a", 0, 0, 1, 3), // height 3
      item("b", 0, 5, 1, 1),
    ];
    const result = compactLayout(input, COLS.lg);
    expect(result[0]).toEqual(item("a", 0, 0, 1, 3));
    // b should land at y=3 (right after a's 3 rows)
    expect(result[1]).toEqual(item("b", 0, 3, 1, 1));
  });

  it("sorts by y then x before compacting", () => {
    const input = [
      item("b", 2, 0),
      item("a", 0, 0),
    ];
    const result = compactLayout(input, COLS.lg);
    // After sorting by (y, x), "a" comes first (x=0) then "b" (x=2)
    expect(result[0].i).toBe("a");
    expect(result[1].i).toBe("b");
  });

  it("keeps items in different columns at the same row when no overlap", () => {
    const input = [
      item("a", 0, 0, 1, 1),
      item("b", 1, 0, 1, 1),
    ];
    const result = compactLayout(input, COLS.lg);
    expect(result).toEqual([
      item("a", 0, 0, 1, 1),
      item("b", 1, 0, 1, 1),
    ]);
  });
});

// ===========================================================================
// moveItem
// ===========================================================================
describe("moveItem", () => {
  const cols = COLS.lg;

  it("moved item keeps exact target position", () => {
    const items = [item("a", 0, 0), item("b", 2, 0)];
    const result = moveItem(items, "a", 3, 4, cols);
    const moved = result.find((i) => i.i === "a")!;
    expect(moved.x).toBe(3);
    expect(moved.y).toBe(4);
  });

  it("pushes existing item away when moving to occupied position", () => {
    const items = [item("a", 0, 0), item("b", 0, 1)];
    // Move a to where b starts (x=0, y=1)
    const result = moveItem(items, "a", 0, 1, cols);
    const a = result.find((i) => i.i === "a")!;
    const b = result.find((i) => i.i === "b")!;
    expect(a.x).toBe(0);
    expect(a.y).toBe(1);
    // b should be displaced — moved item is placed first, then others compact.
    // b compacts to the lowest free y at x=0 that doesn't overlap a.
    // Verify no overlap between any pair of result items.
    const noOverlap = !(
      a.x + a.w <= b.x ||
      b.x + b.w <= a.x ||
      a.y + a.h <= b.y ||
      b.y + b.h <= a.y
    );
    expect(noOverlap).toBe(false); // they must NOT overlap
  });

  it("returns original array when activeId is not found", () => {
    const items = [item("a", 0, 0)];
    const result = moveItem(items, "nonexistent", 5, 5, cols);
    expect(result).toBe(items); // same reference
  });

  it("clamps x to valid range when targetX exceeds cols - item width", () => {
    const items = [item("a", 0, 0, 2, 1)];
    const result = moveItem(items, "a", 20, 0, cols);
    const moved = result.find((i) => i.i === "a")!;
    expect(moved.x).toBe(cols - 2); // 10
  });

  it("clamps x to 0 when targetX is negative", () => {
    const items = [item("a", 2, 2)];
    const result = moveItem(items, "a", -5, 3, cols);
    const moved = result.find((i) => i.i === "a")!;
    expect(moved.x).toBe(0);
  });

  it("clamps y to 0 when targetY is negative", () => {
    const items = [item("a", 0, 0)];
    const result = moveItem(items, "a", 0, -10, cols);
    const moved = result.find((i) => i.i === "a")!;
    expect(moved.y).toBe(0);
  });

  it("keeps non-conflicting items in their original positions", () => {
    const items = [
      item("a", 0, 0),
      item("b", 0, 3),
      item("c", 0, 6),
    ];
    // Move a far away; b and c don't conflict with a's new position, so they stay put
    const result = moveItem(items, "a", 6, 10, cols);
    const b = result.find((i) => i.i === "b")!;
    const c = result.find((i) => i.i === "c")!;
    expect(b.y).toBe(3);
    expect(c.y).toBe(6);
  });

  it("moves only conflicting items away (others stay)", () => {
    const items = [
      item("a", 0, 0),
      item("b", 2, 0),
      item("c", 0, 5),
    ];
    // Move a to (2, 0) — conflicts with b; c is unaffected
    const result = moveItem(items, "a", 2, 0, cols);
    const a = result.find((i) => i.i === "a")!;
    const b = result.find((i) => i.i === "b")!;
    const c = result.find((i) => i.i === "c")!;
    expect(a.x).toBe(2);
    expect(a.y).toBe(0);
    expect(b.x !== 2 || b.y !== 0).toBe(true); // displaced away from the moved item
    expect(c.y).toBe(5); // untouched
  });

  it("handles moving a multi-cell item correctly", () => {
    const items = [item("a", 0, 0, 2, 2), item("b", 2, 0)];
    const result = moveItem(items, "a", 4, 3, cols);
    const moved = result.find((i) => i.i === "a")!;
    expect(moved.x).toBe(4);
    expect(moved.y).toBe(3);
    expect(moved.w).toBe(2);
    expect(moved.h).toBe(2);
  });

  it("no resulting items overlap", () => {
    const items = [
      item("a", 0, 0),
      item("b", 1, 0),
      item("c", 0, 1),
      item("d", 5, 3, 2, 2),
    ];
    const result = moveItem(items, "b", 5, 3, cols);
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const overlaps = !(
          a.x + a.w <= b.x ||
          b.x + b.w <= a.x ||
          a.y + a.h <= b.y ||
          b.y + b.h <= a.y
        );
        expect(overlaps).toBe(false);
      }
    }
  });
});

// ===========================================================================
// gridToPixels
// ===========================================================================
describe("gridToPixels", () => {
  const margin = MARGIN as [number, number];

  it("computes correct pixels for a 1x1 item at origin with 12 cols", () => {
    const layout = item("a", 0, 0);
    const containerWidth = 1200;
    const result = gridToPixels(layout, containerWidth, COLS.lg, ROW_HEIGHT, margin);
    const cellWidth = (containerWidth - (COLS.lg - 1) * margin[0]) / COLS.lg;
    expect(result.left).toBeCloseTo(0);
    expect(result.top).toBeCloseTo(0);
    expect(result.width).toBeCloseTo(cellWidth);
    expect(result.height).toBeCloseTo(ROW_HEIGHT);
  });

  it("computes correct left/top for item at non-zero position", () => {
    const layout = item("a", 3, 2);
    const containerWidth = 1200;
    const result = gridToPixels(layout, containerWidth, COLS.lg, ROW_HEIGHT, margin);
    const cellWidth = (containerWidth - (COLS.lg - 1) * margin[0]) / COLS.lg;
    expect(result.left).toBeCloseTo(3 * (cellWidth + margin[0]));
    expect(result.top).toBeCloseTo(2 * (ROW_HEIGHT + margin[1]));
  });

  it("computes correct width for a 2x1 item (horizontal span)", () => {
    const layout = item("a", 0, 0, 2, 1);
    const containerWidth = 1200;
    const result = gridToPixels(layout, containerWidth, COLS.lg, ROW_HEIGHT, margin);
    const cellWidth = (containerWidth - (COLS.lg - 1) * margin[0]) / COLS.lg;
    expect(result.width).toBeCloseTo(2 * cellWidth + (2 - 1) * margin[0]);
  });

  it("computes correct height for a 1x2 item (vertical span)", () => {
    const layout = item("a", 0, 0, 1, 2);
    const containerWidth = 1200;
    const result = gridToPixels(layout, containerWidth, COLS.lg, ROW_HEIGHT, margin);
    expect(result.height).toBeCloseTo(2 * ROW_HEIGHT + (2 - 1) * margin[1]);
  });

  it("computes correct dimensions for a 2x2 item", () => {
    const layout = item("a", 0, 0, 2, 2);
    const containerWidth = 1200;
    const result = gridToPixels(layout, containerWidth, COLS.lg, ROW_HEIGHT, margin);
    const cellWidth = (containerWidth - (COLS.lg - 1) * margin[0]) / COLS.lg;
    expect(result.width).toBeCloseTo(2 * cellWidth + margin[0]);
    expect(result.height).toBeCloseTo(2 * ROW_HEIGHT + margin[1]);
  });

  it("works at different container widths (responsive)", () => {
    const layout = item("a", 0, 0);
    const widths = [500, 768, 1100, 1440];
    for (const w of widths) {
      const result = gridToPixels(layout, w, COLS.lg, ROW_HEIGHT, margin);
      expect(result.left).toBeCloseTo(0);
      expect(result.top).toBeCloseTo(0);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeCloseTo(ROW_HEIGHT);
    }
  });
});

// ===========================================================================
// pixelsToGrid
// ===========================================================================
describe("pixelsToGrid", () => {
  const margin = MARGIN as [number, number];

  function cellWidth(containerWidth: number, cols: number): number {
    return (containerWidth - (cols - 1) * margin[0]) / cols;
  }

  it("returns {x:0, y:0} when clicking center of cell (0,0)", () => {
    const containerWidth = 1200;
    const cols = COLS.lg;
    const cw = cellWidth(containerWidth, cols);
    const rect = makeRect(0, 0, containerWidth, 1000);
    // Center of cell (0,0)
    const cx = cw / 2;
    const cy = ROW_HEIGHT / 2;
    const result = pixelsToGrid(cx, cy, rect, 1, cols, ROW_HEIGHT, margin);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("returns {x:1, y:1} when clicking center of cell (1,1)", () => {
    const containerWidth = 1200;
    const cols = COLS.lg;
    const cw = cellWidth(containerWidth, cols);
    const rect = makeRect(0, 0, containerWidth, 1000);
    // Center of cell (1,1)
    const cx = 1 * (cw + margin[0]) + cw / 2;
    const cy = 1 * (ROW_HEIGHT + margin[1]) + ROW_HEIGHT / 2;
    const result = pixelsToGrid(cx, cy, rect, 1, cols, ROW_HEIGHT, margin);
    expect(result.x).toBe(1);
    expect(result.y).toBe(1);
  });

  it("clamps x to 0 when click is to the left of container", () => {
    const containerWidth = 1200;
    const cols = COLS.lg;
    const rect = makeRect(50, 50, containerWidth, 1000);
    const result = pixelsToGrid(30, 100, rect, 1, cols, ROW_HEIGHT, margin);
    expect(result.x).toBe(0);
  });

  it("clamps x to cols - itemW when click is far right", () => {
    const containerWidth = 1200;
    const cols = COLS.lg;
    const itemW = 3;
    const rect = makeRect(0, 0, containerWidth, 1000);
    const result = pixelsToGrid(
      containerWidth + 500,
      100,
      rect,
      itemW,
      cols,
      ROW_HEIGHT,
      margin
    );
    expect(result.x).toBe(cols - itemW);
  });

  it("clamps y to >= 0", () => {
    const containerWidth = 1200;
    const cols = COLS.lg;
    const rect = makeRect(0, 100, containerWidth, 1000);
    const result = pixelsToGrid(50, 50, rect, 1, cols, ROW_HEIGHT, margin);
    expect(result.y).toBe(0);
  });

  it("works at different container widths and column counts", () => {
    const testCases: { width: number; cols: number; bp: string }[] = [
      { width: 500, cols: COLS.sm, bp: "sm" },
      { width: 768, cols: COLS.md, bp: "md" },
      { width: 1100, cols: COLS.lg, bp: "lg" },
    ];
    for (const { width, cols } of testCases) {
      const cw = cellWidth(width, cols);
      const rect = makeRect(0, 0, width, 1000);
      // Click center of cell (0,0)
      const result = pixelsToGrid(
        cw / 2,
        ROW_HEIGHT / 2,
        rect,
        1,
        cols,
        ROW_HEIGHT,
        margin
      );
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      // Click center of last valid cell for a 1-wide item
      const lastCellX = (cols - 1) * (cw + margin[0]) + cw / 2;
      const resultLast = pixelsToGrid(
        lastCellX,
        ROW_HEIGHT / 2,
        rect,
        1,
        cols,
        ROW_HEIGHT,
        margin
      );
      expect(resultLast.x).toBe(cols - 1);
    }
  });
});

// ===========================================================================
// Round-trip: gridToPixels -> pixelsToGrid
// ===========================================================================
describe("gridToPixels / pixelsToGrid round-trip", () => {
  const margin = MARGIN as [number, number];

  it("round-trips correctly for a 1x1 item at (0,0)", () => {
    const layout = item("a", 0, 0);
    const containerWidth = 1200;
    const cols = COLS.lg;
    const px = gridToPixels(layout, containerWidth, cols, ROW_HEIGHT, margin);
    const rect = makeRect(0, 0, containerWidth, 2000);
    // Click the center of the computed pixel rect
    const grid = pixelsToGrid(
      px.left + px.width / 2,
      px.top + px.height / 2,
      rect,
      layout.w,
      cols,
      ROW_HEIGHT,
      margin
    );
    expect(grid.x).toBe(layout.x);
    expect(grid.y).toBe(layout.y);
  });

  it("round-trips correctly for a 2x2 item at (3, 2)", () => {
    const layout = item("a", 3, 2, 2, 2);
    const containerWidth = 1200;
    const cols = COLS.lg;
    const px = gridToPixels(layout, containerWidth, cols, ROW_HEIGHT, margin);
    const rect = makeRect(0, 0, containerWidth, 2000);
    // Use a point within the first cell of the item for a stable round-trip
    // (center of the pixel rect can round to the wrong cell for multi-cell items)
    const cw = (containerWidth - (cols - 1) * margin[0]) / cols;
    const grid = pixelsToGrid(
      px.left + cw / 2,
      px.top + ROW_HEIGHT / 2,
      rect,
      layout.w,
      cols,
      ROW_HEIGHT,
      margin
    );
    expect(grid.x).toBe(layout.x);
    expect(grid.y).toBe(layout.y);
  });

  it("round-trips correctly for an item at the far right edge", () => {
    const cols = COLS.lg;
    const layout = item("a", cols - 1, 0);
    const containerWidth = 1200;
    const px = gridToPixels(layout, containerWidth, cols, ROW_HEIGHT, margin);
    const rect = makeRect(0, 0, containerWidth, 2000);
    const grid = pixelsToGrid(
      px.left + px.width / 2,
      px.top + px.height / 2,
      rect,
      layout.w,
      cols,
      ROW_HEIGHT,
      margin
    );
    expect(grid.x).toBe(layout.x);
    expect(grid.y).toBe(layout.y);
  });
});

// ===========================================================================
// Constants sanity checks
// ===========================================================================
describe("constants", () => {
  it("BREAKPOINTS are ordered lg > md > sm > xs", () => {
    expect(BREAKPOINTS.lg).toBeGreaterThan(BREAKPOINTS.md);
    expect(BREAKPOINTS.md).toBeGreaterThan(BREAKPOINTS.sm);
    expect(BREAKPOINTS.sm).toBeGreaterThan(BREAKPOINTS.xs);
    expect(BREAKPOINTS.xs).toBe(0);
  });

  it("COLS decrease as breakpoints decrease", () => {
    expect(COLS.lg).toBeGreaterThan(COLS.md);
    expect(COLS.md).toBeGreaterThan(COLS.sm);
    expect(COLS.sm).toBeGreaterThan(COLS.xs);
  });

  it("ROW_HEIGHT is positive", () => {
    expect(ROW_HEIGHT).toBeGreaterThan(0);
  });

  it("MARGIN has two positive values", () => {
    expect(MARGIN[0]).toBeGreaterThan(0);
    expect(MARGIN[1]).toBeGreaterThan(0);
  });
});

// ===========================================================================
// buildLayout — 持久化幂等性（防回归"重启后位置变动"）
// ===========================================================================
function makeTool(
  id: number,
  gridX: number,
  gridY: number,
  size: ToolSize = "1x1",
  sort: number = 0
): Tool {
  return {
    id,
    name: `tool-${id}`,
    url: `https://example.com/${id}`,
    logo: "",
    catelog: "test",
    desc: "",
    sort,
    hide: false,
    viewMode: "icon",
    type: "icon",
    parentId: null,
    size,
    bgColor: "",
    gridX,
    gridY,
    folderViewMode: "grid",
    folderItemSize: 28,
  };
}

function toolsFromLayout(layout: GridLayout[]): Tool[] {
  return layout.map((l) =>
    makeTool(Number(l.i), l.x, l.y, `${l.w}x${l.h}` as ToolSize, Number(l.i))
  );
}

describe("buildLayout — idempotency (regression for restart drift)", () => {
  it("running buildLayout twice on its own output produces the same layout", () => {
    const tools = [
      makeTool(1, 0, 0, "1x1", 0),
      makeTool(2, 2, 0, "1x1", 1),
      makeTool(3, 5, 3, "2x2", 2),
      makeTool(4, 8, 0, "1x1", 3),
    ];
    const cols = COLS.lg;
    const first = buildLayout(tools, cols);
    const second = buildLayout(toolsFromLayout(first), cols);
    expect(second).toEqual(first);
  });

  it("preserves user positions across calls (no drift)", () => {
    const tools = [
      makeTool(1, 0, 0),
      makeTool(2, 5, 2),
      makeTool(3, 10, 5),
    ];
    const cols = COLS.lg;
    const result = buildLayout(tools, cols);
    for (const tool of tools) {
      const placed = result.find((l) => l.i === String(tool.id))!;
      expect(placed.x).toBe(tool.gridX);
      expect(placed.y).toBe(tool.gridY);
    }
  });

  it("new tools (gridX < 0) find empty positions without compressing positioned tools", () => {
    const tools = [
      makeTool(1, 0, 0, "1x1", 0), // 已有位置
      makeTool(2, 5, 0, "1x1", 1), // 已有位置
      makeTool(3, -1, -1, "1x1", 2), // 新项
      makeTool(4, -1, -1, "1x1", 3), // 新项
    ];
    const cols = COLS.lg;
    const result = buildLayout(tools, cols);

    // 已有位置项保持原位
    expect(result.find((l) => l.i === "1")!.x).toBe(0);
    expect(result.find((l) => l.i === "1")!.y).toBe(0);
    expect(result.find((l) => l.i === "2")!.x).toBe(5);
    expect(result.find((l) => l.i === "2")!.y).toBe(0);

    // 新项在空位（应找到 x ∈ [1,4] ∪ [6,11] 中的空位）
    const new3 = result.find((l) => l.i === "3")!;
    const new4 = result.find((l) => l.i === "4")!;
    expect(new3.x).not.toBe(0); // 不该和已有项冲突
    expect(new3.x).not.toBe(5);
    expect(new4.x).not.toBe(0);
    expect(new4.x).not.toBe(5);
  });

  it("autoLayout path is deterministic when no tool has saved position", () => {
    const tools = [
      makeTool(1, -1, -1, "1x1", 0),
      makeTool(2, -1, -1, "1x1", 1),
      makeTool(3, -1, -1, "1x1", 2),
    ];
    const cols = COLS.lg;
    const a = buildLayout(tools, cols);
    const b = buildLayout(tools, cols);
    expect(a).toEqual(b);
  });
});

