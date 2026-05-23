import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./index.css";
import { getEnabledSearchEngines, generateSearchUrl } from "../../utils/searchEngine";
import type { SearchEngine } from "../../types";
import { FloatingPortal } from "../OverlayLayer/FloatingPortal";
import { useOutsidePointerDown } from "../OverlayLayer/useOutsidePointerDown";
import { computePlacement } from "../OverlayLayer/placement";

const STORAGE_KEY = "selectedSearchEngineId";

interface SearchBarProps {
  setSearchText: (t: string) => void;
  searchString: string;
  onSelectedEngineChange?: (engine: SearchEngine | null) => void;
}

const SearchBar = (props: SearchBarProps) => {
  const [engines, setEngines] = useState<SearchEngine[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const reg = /[a-zA-Z0-9]|[一-龥]/g;
      if (ev.code === "Enter" || reg.test(ev.key)) {
        const el = document.getElementById("search-bar");
        if (el) {
          el.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    getEnabledSearchEngines().then((list) => {
      const sorted = list
        .filter((e) => e.enabled)
        .sort((a, b) => a.sort - b.sort);
      setEngines(sorted);

      const storedId = localStorage.getItem(STORAGE_KEY);
      const match = storedId
        ? sorted.find((e) => e.id === Number(storedId))
        : null;
      const engine = match ?? sorted[0] ?? null;
      setSelectedEngine(engine);
      props.onSelectedEngineChange?.(engine);
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isDropdownOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDropdownOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isDropdownOpen]);

  // Close on outside pointer down
  const handleClose = useCallback(() => setIsDropdownOpen(false), []);
  useOutsidePointerDown(menuRef, handleClose, isDropdownOpen);

  const handleSelectEngine = useCallback(
    (engine: SearchEngine) => {
      setSelectedEngine(engine);
      localStorage.setItem(STORAGE_KEY, String(engine.id));
      setIsDropdownOpen(false);
      props.onSelectedEngineChange?.(engine);
    },
    [props.onSelectedEngineChange]
  );

  const handleToggle = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  // Compute dropdown position from button
  const menuPosition = (() => {
    if (!buttonRef.current) return { left: 0, top: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    const pos = computePlacement({
      anchorRect: rect,
      panelWidth: 160,
      panelHeight: Math.min(engines.length * 40 + 8, 300),
      placement: "right-start",
      margin: 8,
    });
    return pos;
  })();

  const engineLetter = selectedEngine?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="search span-3">
      <div className="search-wraper">
        <svg
          className="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="search-bar"
          type="search"
          placeholder="按任意键直接开始搜索"
          value={props.searchString}
          onChange={(ev) => {
            props.setSearchText(ev.target.value);
          }}
        />
        <div className="engine-selector">
          <button
            ref={buttonRef}
            className="engine-selector-btn"
            onClick={handleToggle}
            title={selectedEngine?.name ?? "选择搜索引擎"}
            type="button"
          >
            {engineLetter}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isDropdownOpen && engines.length > 0 && (
          <FloatingPortal>
            <motion.ul
              ref={menuRef}
              className="engine-dropdown"
              initial={{ opacity: 0, scaleX: 0.2, scaleY: 0.75 }}
              animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleX: 0.2, scaleY: 0.75 }}
              transition={{ duration: 0.18 }}
              style={{
                left: menuPosition.left,
                top: menuPosition.top,
                transformOrigin: "left center",
              }}
            >
              {engines.map((engine) => (
                <li
                  key={engine.id}
                  className={`engine-dropdown-item${selectedEngine?.id === engine.id ? " active" : ""}`}
                  onClick={() => handleSelectEngine(engine)}
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
    </div>
  );
};

export default SearchBar;
