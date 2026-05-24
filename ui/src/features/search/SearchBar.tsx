import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SearchEngine } from "../../types";
import { getEnabledSearchEngines } from "../../utils/searchEngine";
import { computePlacement } from "../../shared/ui/overlay/placement";
import { useOutsidePointerDown } from "../../shared/ui/overlay/useOutsidePointerDown";
import { SearchEngineDropdown } from "./SearchEngineDropdown";
import { useSearchFocusShortcut } from "./useSearchFocusShortcut";
import "./search-bar.css";

const STORAGE_KEY = "selectedSearchEngineId";
const DROPDOWN_WIDTH = 160;

interface SearchBarProps {
  setSearchText: (t: string) => void;
  searchString: string;
  onSelectedEngineChange?: (engine: SearchEngine | null) => void;
}

const SearchBar = ({
  setSearchText,
  searchString,
  onSelectedEngineChange,
}: SearchBarProps) => {
  const [engines, setEngines] = useState<SearchEngine[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useSearchFocusShortcut();

  useEffect(() => {
    getEnabledSearchEngines().then((list) => {
      const sorted = list
        .filter((engine) => engine.enabled)
        .sort((a, b) => a.sort - b.sort);
      setEngines(sorted);

      const storedId = localStorage.getItem(STORAGE_KEY);
      const matchedEngine = storedId
        ? sorted.find((engine) => engine.id === Number(storedId))
        : null;
      const nextEngine = matchedEngine ?? sorted[0] ?? null;
      setSelectedEngine(nextEngine);
      onSelectedEngineChange?.(nextEngine);
    });
  }, [onSelectedEngineChange]);

  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen]);

  const handleClose = useCallback(() => setIsDropdownOpen(false), []);
  useOutsidePointerDown(menuRef, handleClose, isDropdownOpen);

  const handleSelectEngine = useCallback(
    (engine: SearchEngine) => {
      setSelectedEngine(engine);
      localStorage.setItem(STORAGE_KEY, String(engine.id));
      setIsDropdownOpen(false);
      onSelectedEngineChange?.(engine);
    },
    [onSelectedEngineChange]
  );

  const menuPosition = useMemo(() => {
    if (!buttonRef.current) {
      return { left: 0, top: 0 };
    }

    return computePlacement({
      anchorRect: buttonRef.current.getBoundingClientRect(),
      panelWidth: DROPDOWN_WIDTH,
      panelHeight: Math.min(engines.length * 40 + 8, 300),
      placement: "right-start",
      margin: 8,
    });
  }, [engines.length, isDropdownOpen]);

  const engineLetter = selectedEngine?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="search span-3">
      <div className="search-wrapper">
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
          value={searchString}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <div className="engine-selector">
          <button
            ref={buttonRef}
            className="engine-selector-btn"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            title={selectedEngine?.name ?? "选择搜索引擎"}
            type="button"
          >
            {engineLetter}
          </button>
        </div>
      </div>

      <SearchEngineDropdown
        open={isDropdownOpen}
        engines={engines}
        selectedEngine={selectedEngine}
        menuRef={menuRef}
        position={menuPosition}
        onSelect={handleSelectEngine}
      />
    </div>
  );
};

export default SearchBar;
