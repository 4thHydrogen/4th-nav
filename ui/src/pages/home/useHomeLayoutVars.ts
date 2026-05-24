import { useEffect, useMemo } from "react";

export type GridLayoutConfig = {
  rowHeight: number;
  margin: [number, number];
};

const DENSITY_PARAMS: Record<
  string,
  { rowHeight: number; iconSize: number; iconGap: number; margin: number }
> = {
  compact: { rowHeight: 64, iconSize: 38, iconGap: 4, margin: 8 },
  standard: { rowHeight: 80, iconSize: 48, iconGap: 6, margin: 12 },
  relaxed: { rowHeight: 100, iconSize: 62, iconGap: 8, margin: 16 },
};

export function useHomeLayoutVars(density?: string): GridLayoutConfig {
  useEffect(() => {
    const el = document.querySelector(".desktop-page") as HTMLElement | null;
    if (!el) return;
    const current = DENSITY_PARAMS[density || "standard"] || DENSITY_PARAMS.standard;
    el.style.setProperty("--icon-size", `${current.iconSize}px`);
    el.style.setProperty("--icon-gap", `${current.iconGap}px`);
    el.style.setProperty("--row-height", `${current.rowHeight}px`);
    el.style.setProperty("--grid-margin", `${current.margin}px`);
    el.style.setProperty("--folder-inner-gap", `${current.iconGap}px`);
  }, [density]);

  useEffect(() => {
    const pageEl = document.querySelector(".desktop-page") as HTMLElement | null;
    const workspaceEl = document.querySelector(".desktop-workspace") as HTMLElement | null;
    if (!pageEl || !workspaceEl) return;

    const breakpoints = { lg: 1100, md: 768, sm: 500, xs: 0 };
    const columns = { lg: 12, md: 8, sm: 5, xs: 3 };
    const getBreakpoint = (width: number) => {
      if (width >= breakpoints.lg) return "lg";
      if (width >= breakpoints.md) return "md";
      if (width >= breakpoints.sm) return "sm";
      return "xs";
    };

    const update = () => {
      const style = getComputedStyle(pageEl);
      const margin = parseFloat(style.getPropertyValue("--grid-margin")) || 12;
      const contentWidth = workspaceEl.clientWidth;
      const breakpoint = getBreakpoint(contentWidth);
      const cols = columns[breakpoint];
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

  const layoutConfig = useMemo<GridLayoutConfig>(() => {
    const current = DENSITY_PARAMS[density || "standard"] || DENSITY_PARAMS.standard;
    return { rowHeight: current.rowHeight, margin: [current.margin, current.margin] };
  }, [density]);

  return layoutConfig;
}
