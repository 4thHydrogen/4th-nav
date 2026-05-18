import { useCallback, useEffect, useRef, useState } from "react";
import { Settings, X, List } from "lucide-react";
import "./index.css";

interface MobileCategoryMenuProps {
  categories: string[];
  selectedCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  onClearFilters: () => void;
}

const MobileCategoryMenu = ({
  categories,
  selectedCategories,
  onToggleCategory,
  onClearFilters,
}: MobileCategoryMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasFilters = selectedCategories.size > 0;

  const close = useCallback(() => setIsOpen(false), []);

  const handleCategoryClick = useCallback(
    (cat?: string) => {
      if (cat === undefined) {
        onClearFilters();
      } else {
        onToggleCategory(cat);
      }
      close();
    },
    [onClearFilters, onToggleCategory, close]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, close]);

  return (
    <div className="mobile-category-menu" ref={menuRef}>
      <button
        className="mobile-category-btn"
        onClick={() => setIsOpen((p) => !p)}
        aria-label="分类菜单"
      >
        {isOpen ? <X size={20} /> : <List size={20} />}
      </button>

      {isOpen && (
        <>
          <div className="mobile-category-overlay" onClick={close} />
          <div className="mobile-category-dropdown">
            <button
              className={`mobile-category-item ${!hasFilters ? "active" : ""}`}
              onClick={() => handleCategoryClick()}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`mobile-category-item ${selectedCategories.has(cat) ? "active" : ""}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </button>
            ))}
            <div className="mobile-category-divider" />
            <a href="/admin" className="mobile-category-item mobile-category-admin">
              <Settings size={16} />
              <span>管理后台</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileCategoryMenu;
