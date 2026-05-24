import { useCallback, useEffect, useRef, useState } from "react";
import "./category-filter.css";

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  onClearFilters: () => void;
}

const COLLAPSE_DELAY = 1000;

const CategoryFilter = ({
  categories,
  selectedCategories,
  onToggleCategory,
  onClearFilters,
}: CategoryFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFilters = selectedCategories.size > 0;

  const expand = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsExpanded(true);
  }, []);

  const scheduleCollapse = useCallback(() => {
    if (isPinned) return;
    timerRef.current = setTimeout(() => setIsExpanded(false), COLLAPSE_DELAY);
  }, [isPinned]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "[" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        setIsPinned((pinned) => !pinned);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (isPinned) setIsExpanded(true);
  }, [isPinned]);

  const active = isExpanded || isPinned;

  return (
    <>
      <div className="category-filter-trigger" onMouseEnter={expand} />
      <nav
        className={`category-filter ${active ? "is-expanded" : "is-collapsed"}`}
        onMouseEnter={expand}
        onMouseLeave={scheduleCollapse}
      >
        <div className="category-filter-chips">
          <button
            className={`category-filter-chip ${!hasFilters ? "active" : ""}`}
            onClick={onClearFilters}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`category-filter-chip ${selectedCategories.has(category) ? "active" : ""}`}
              onClick={() => onToggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        {isPinned && <div className="category-filter-pin-hint">按 [ 取消固定</div>}
      </nav>
    </>
  );
};

export default CategoryFilter;
