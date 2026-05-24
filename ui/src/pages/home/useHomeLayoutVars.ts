import { useEffect, useMemo } from "react";

export type GridLayoutConfig = {
  columnsPerRow: number | null;
  gap: number;
  iconScale: number;
};

const DENSITY_PARAMS: Record<
  string,
  { gap: number; iconScale: number; fallbackIconSize: number }
> = {
  compact: { gap: 8, iconScale: 0.58, fallbackIconSize: 38 },
  standard: { gap: 12, iconScale: 0.62, fallbackIconSize: 48 },
  relaxed: { gap: 16, iconScale: 0.66, fallbackIconSize: 62 },
};

function resolveColumnsPerRow(raw: number | undefined): number | null {
  if (raw == null || raw <= 6) return null;
  return raw;
}

export function useHomeLayoutVars(
  siteConfig?: { density?: string; columnsPerRow?: number }
): GridLayoutConfig {
  useEffect(() => {
    const el = document.querySelector(".desktop-page") as HTMLElement | null;
    if (!el) return;
    const current = DENSITY_PARAMS[siteConfig?.density || "standard"] || DENSITY_PARAMS.standard;
    el.style.setProperty("--grid-margin", `${current.gap}px`);
    el.style.setProperty("--cell-gap-x", `${current.gap}px`);
    el.style.setProperty("--cell-gap-y", `${current.gap}px`);
    el.style.setProperty("--folder-inner-gap", `${current.gap * 0.5}px`);
    el.style.setProperty("--icon-gap", `${current.gap * 0.5}px`);
    el.style.setProperty("--icon-size", `${current.fallbackIconSize}px`);
  }, [siteConfig?.density]);

  const layoutConfig = useMemo<GridLayoutConfig>(() => {
    const current = DENSITY_PARAMS[siteConfig?.density || "standard"] || DENSITY_PARAMS.standard;
    return {
      columnsPerRow: resolveColumnsPerRow(siteConfig?.columnsPerRow),
      gap: current.gap,
      iconScale: current.iconScale,
    };
  }, [siteConfig?.density, siteConfig?.columnsPerRow]);

  return layoutConfig;
}
