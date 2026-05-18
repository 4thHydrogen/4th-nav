import { Settings } from "lucide-react";
import "./index.css";

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  onClearFilters: () => void;
}

const CategoryFilter = ({ categories, selectedCategories, onToggleCategory, onClearFilters }: CategoryFilterProps) => {
  const hasFilters = selectedCategories.size > 0;

  return (
    <nav className="category-filter">
      <div className="category-filter-chips">
        <button
          className={`category-filter-chip ${!hasFilters ? "active" : ""}`}
          onClick={onClearFilters}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-filter-chip ${selectedCategories.has(cat) ? "active" : ""}`}
            onClick={() => onToggleCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <a
        href="/admin"
        className="category-filter-settings"
        title="管理后台"
        aria-label="管理后台"
      >
        <Settings size={20} />
      </a>
    </nav>
  );
};

export default CategoryFilter;
