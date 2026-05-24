import { useEffect } from "react";
import { extractEdgeLightMap } from "./extractEdgeLightMap";

const CSS_VAR = "--search-edge-light-map";
const RESIZE_DEBOUNCE_MS = 150;

export function useSearchEdgeLightMap(localImageUrl: string | null) {
  useEffect(() => {
    if (!localImageUrl) {
      removeVariable();
      return;
    }

    const apply = (img: HTMLImageElement) => {
      const wrapper = document.querySelector(".search-wrapper");
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const accentColor = readAccentColor();
      const gradient = extractEdgeLightMap(img, rect, accentColor);
      document.documentElement.style.setProperty(CSS_VAR, gradient);
    };

    const img = new Image();
    img.onload = () => {
      try {
        apply(img);
      } catch {
        removeVariable();
      }
    };
    img.onerror = () => removeVariable();
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
      removeVariable();
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

function removeVariable() {
  document.documentElement.style.removeProperty(CSS_VAR);
}
