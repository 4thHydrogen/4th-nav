import { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";
import { getEnabledSearchEngines, generateSearchUrl } from "../../utils/searchEngine";
import type { SearchEngine } from "../../types";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClick = (ev: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(ev.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isDropdownOpen]);

  const handleSelectEngine = useCallback(
    (engine: SearchEngine) => {
      setSelectedEngine(engine);
      localStorage.setItem(STORAGE_KEY, String(engine.id));
      setIsDropdownOpen(false);
      props.onSelectedEngineChange?.(engine);
    },
    [props.onSelectedEngineChange]
  );

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
        <div className="engine-selector" ref={dropdownRef}>
          <button
            className="engine-selector-btn"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            title={selectedEngine?.name ?? "选择搜索引擎"}
            type="button"
          >
            {engineLetter}
          </button>
          {isDropdownOpen && engines.length > 0 && (
            <ul className="engine-dropdown">
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
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
