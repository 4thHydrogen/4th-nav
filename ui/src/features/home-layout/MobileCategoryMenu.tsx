import { useCallback, useEffect, useRef, useState } from "react";
import { List, Settings, X } from "lucide-react";
import "./mobile-category-menu.css";

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
    (category?: string) => {
      if (category === undefined) {
        onClearFilters();
      } else {
        onToggleCategory(category);
      }
      close();
    },
    [onClearFilters, onToggleCategory, close]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
        onClick={() => setIsOpen((open) => !open)}
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
            {categories.map((category) => (
              <button
                key={category}
                className={`mobile-category-item ${selectedCategories.has(category) ? "active" : ""}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
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
