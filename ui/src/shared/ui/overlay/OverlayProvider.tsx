import { useEffect, useCallback, useState, type ReactNode } from "react";
import { createContext, useContext } from "react";

const OverlayContext = createContext<HTMLElement | null>(null);

export function useOverlayRoot() {
  return useContext(OverlayContext);
}

interface OverlayProviderProps {
  children: ReactNode;
}

export function OverlayProvider({ children }: OverlayProviderProps) {
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    let el = document.getElementById("app-overlay-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "app-overlay-root";
      document.body.appendChild(el);
    }
    setRootEl(el);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overlay-open", activeCount > 0);
  }, [activeCount]);

  const register = useCallback(() => {
    setActiveCount((n) => n + 1);
    return () => setActiveCount((n) => n - 1);
  }, []);

  return (
    <OverlayContext.Provider value={rootEl}>
      <OverlayActivityContext.Provider value={register}>
        {children}
      </OverlayActivityContext.Provider>
    </OverlayContext.Provider>
  );
}

const OverlayActivityContext = createContext<() => () => void>(() => () => {});

export function useOverlayActivity() {
  return useContext(OverlayActivityContext);
}
