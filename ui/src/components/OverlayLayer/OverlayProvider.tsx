import { useEffect, useRef, useCallback, useState, type ReactNode } from "react";
import { createContext, useContext } from "react";

const OverlayContext = createContext<HTMLElement | null>(null);

export function useOverlayRoot() {
  return useContext(OverlayContext);
}

interface OverlayProviderProps {
  children: ReactNode;
}

export function OverlayProvider({ children }: OverlayProviderProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    let el = document.getElementById("app-overlay-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "app-overlay-root";
      document.body.appendChild(el);
    }
    rootRef.current = el;
  }, []);

  // Manage body.overlay-open class
  useEffect(() => {
    document.body.classList.toggle("overlay-open", activeCount > 0);
  }, [activeCount]);

  const register = useCallback(() => {
    setActiveCount((n) => n + 1);
    return () => setActiveCount((n) => n - 1);
  }, []);

  return (
    <OverlayContext.Provider value={rootRef.current}>
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
