import { useEffect } from "react";
import { extractAccentColors } from "./extractAccentColors";

const CSS_VAR_NAMES = [
  "--search-glow-1",
  "--search-glow-2",
  "--search-glow-3",
] as const;

export function useBackgroundAccentColors(localImageUrl: string | null) {
  useEffect(() => {
    if (!localImageUrl) {
      resetGlowVariables();
      return;
    }

    extractAccentColors(localImageUrl).then((colors) => {
      const root = document.documentElement;
      root.style.setProperty(CSS_VAR_NAMES[0], colors.glow1.join(", "));
      root.style.setProperty(CSS_VAR_NAMES[1], colors.glow2.join(", "));
      root.style.setProperty(CSS_VAR_NAMES[2], colors.glow3.join(", "));
    });

    return () => resetGlowVariables();
  }, [localImageUrl]);
}

function resetGlowVariables() {
  const root = document.documentElement;
  CSS_VAR_NAMES.forEach((name) => root.style.removeProperty(name));
}
