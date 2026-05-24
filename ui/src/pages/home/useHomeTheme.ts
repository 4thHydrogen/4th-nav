import { useCallback, useEffect, useState } from "react";
import { applyTheme, decodeTheme, initTheme } from "../../utils/theme";

export function useHomeTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "auto">(initTheme());

  useEffect(() => {
    localStorage.setItem("theme", theme);
    applyTheme(decodeTheme(theme), "setTheme", true);
  }, [theme]);

  const handleThemeSwitch = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : prev === "dark" ? "auto" : "light"));
  }, []);

  return { theme, handleThemeSwitch };
}
