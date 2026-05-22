import { useEffect } from "react";

export function useHomeLayoutVars(density?: string) {
  useEffect(() => {
    const el = document.querySelector(".desktop-page") as HTMLElement | null;
    if (!el) return;
    const params: Record<string, { rowHeight: number; iconSize: number; iconGap: number; margin: number }> = {
      compact: { rowHeight: 64, iconSize: 38, iconGap: 4, margin: 8 },
      standard: { rowHeight: 80, iconSize: 48, iconGap: 6, margin: 12 },
      relaxed: { rowHeight: 100, iconSize: 62, iconGap: 8, margin: 16 },
    };
    const p = params[density || "standard"] || params.standard;
    el.style.setProperty("--icon-size", `${p.iconSize}px`);
    el.style.setProperty("--icon-gap", `${p.iconGap}px`);
    el.style.setProperty("--row-height", `${p.rowHeight}px`);
    el.style.setProperty("--grid-margin", `${p.margin}px`);
    el.style.setProperty("--folder-inner-gap", `${p.iconGap}px`);
  }, [density]);

  useEffect(() => {
    const pageEl = document.querySelector(".desktop-page") as HTMLElement | null;
    const workspaceEl = document.querySelector(".desktop-workspace") as HTMLElement | null;
    if (!pageEl || !workspaceEl) return;
    const BP = { lg: 1100, md: 768, sm: 500, xs: 0 };
    const COLS = { lg: 12, md: 8, sm: 5, xs: 3 };
    const getBreakpoint = (w: number) => {
      if (w >= BP.lg) return "lg";
      if (w >= BP.md) return "md";
      if (w >= BP.sm) return "sm";
      return "xs";
    };
    const update = () => {
      const style = getComputedStyle(pageEl);
      const margin = parseFloat(style.getPropertyValue("--grid-margin")) || 12;
      const contentWidth = workspaceEl.clientWidth;
      const bp = getBreakpoint(contentWidth);
      const cols = COLS[bp];
      const cellWidth = cols > 0 ? (contentWidth - (cols - 1) * margin) / cols : 0;
      pageEl.style.setProperty("--cell-width", `${cellWidth}px`);
      pageEl.style.setProperty("--cell-gap-x", `${margin}px`);
      pageEl.style.setProperty("--cell-gap-y", `${margin}px`);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(workspaceEl);
    return () => observer.disconnect();
  }, [density]);
}
