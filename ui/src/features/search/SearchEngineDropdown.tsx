import { AnimatePresence, motion } from "framer-motion";
import { FloatingPortal } from "../../shared/ui/overlay/FloatingPortal";
import type { SearchEngine } from "../../types";

interface SearchEngineDropdownProps {
  open: boolean;
  engines: SearchEngine[];
  selectedEngine: SearchEngine | null;
  menuRef: React.RefObject<HTMLUListElement | null>;
  position: { left: number; top: number };
  onSelect: (engine: SearchEngine) => void;
}

export function SearchEngineDropdown({
  open,
  engines,
  selectedEngine,
  menuRef,
  position,
  onSelect,
}: SearchEngineDropdownProps) {
  return (
    <AnimatePresence>
      {open && engines.length > 0 && (
        <FloatingPortal>
          <motion.ul
            ref={menuRef}
            className="engine-dropdown"
            initial={{ opacity: 0, scaleX: 0.2, scaleY: 0.75 }}
            animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleX: 0.2, scaleY: 0.75 }}
            transition={{ duration: 0.18 }}
            style={{
              left: position.left,
              top: position.top,
              transformOrigin: "left center",
            }}
          >
            {engines.map((engine) => (
              <li
                key={engine.id}
                className={`engine-dropdown-item${
                  selectedEngine?.id === engine.id ? " active" : ""
                }`}
                onClick={() => onSelect(engine)}
              >
                <span className="engine-dropdown-letter">
                  {engine.name.charAt(0).toUpperCase()}
                </span>
                <span className="engine-dropdown-name">{engine.name}</span>
              </li>
            ))}
          </motion.ul>
        </FloatingPortal>
      )}
    </AnimatePresence>
  );
}
