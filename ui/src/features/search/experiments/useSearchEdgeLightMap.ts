import { useEffect } from "react";
import {
  extractEdgeLightMap,
  fallbackGradients,
} from "./extractEdgeLightMap";

const CSS_VAR_BORDER = "--search-edge-light-map";
const CSS_VAR_OUTER_GLOW = "--search-edge-outer-glow-map";
const RESIZE_DEBOUNCE_MS = 150;

export function useSearchEdgeLightMap(localImageUrl: string | null) {
  useEffect(() => {
    if (!localImageUrl) {
      removeVariables();
      return;
    }

    const apply = (img: HTMLImageElement) => {
      const wrapper = document.querySelector(".search-wrapper");
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const accentColor = readAccentColor();
      const result = extractEdgeLightMap(img, rect, accentColor);

      if (result) {
        document.documentElement.style.setProperty(
          CSS_VAR_BORDER,
          result.border
        );
        document.documentElement.style.setProperty(
          CSS_VAR_OUTER_GLOW,
          result.outerGlow
        );
      } else {
        const fallback = fallbackGradients(accentColor);
        document.documentElement.style.setProperty(
          CSS_VAR_BORDER,
          fallback.border
        );
        document.documentElement.style.setProperty(
          CSS_VAR_OUTER_GLOW,
          fallback.outerGlow
        );
      }
    };

    const img = new Image();
    img.onload = () => {
      try {
        apply(img);
      } catch {
        removeVariables();
      }
    };
    img.onerror = () => removeVariables();
    img.src = localImageUrl;

    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (img.complete && img.naturalWidth > 0) {
          try {
            apply(img);
          } catch {
            /* keep previous value */
          }
        }
      }, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
      removeVariables();
    };
  }, [localImageUrl]);
}

function readAccentColor(): [number, number, number] | undefined {
  const raw = document.documentElement.style.getPropertyValue(
    "--search-glow-1"
  );
  if (!raw) return undefined;

  const parts = raw.split(",").map((s) => parseInt(s.trim(), 10));
  if (parts.length !== 3 || parts.some(isNaN)) return undefined;

  return parts as [number, number, number];
}

function removeVariables() {
  document.documentElement.style.removeProperty(CSS_VAR_BORDER);
  document.documentElement.style.removeProperty(CSS_VAR_OUTER_GLOW);
}
