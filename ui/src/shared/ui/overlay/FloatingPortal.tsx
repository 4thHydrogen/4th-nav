import { createPortal } from "react-dom";
import { useOverlayRoot } from "./OverlayProvider";
import type { ReactNode } from "react";

interface FloatingPortalProps {
  children: ReactNode;
}

export function FloatingPortal({ children }: FloatingPortalProps) {
  const root = useOverlayRoot();
  if (!root) return null;
  return createPortal(children, root);
}
