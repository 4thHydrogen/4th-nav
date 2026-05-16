import "./index.css";
import { SettingOutlined } from "@ant-design/icons";

interface LeftCategoryNavProps {
  categories: string[];
  activeCategory: string;
  onNavigate: (category: string) => void;
}

const LeftCategoryNav = ({ categories, activeCategory, onNavigate }: LeftCategoryNavProps) => {
  const getCategoryLabel = (category: string) => {
    const trimmed = category.trim();
    return trimmed.length > 2 ? trimmed.slice(0, 2) : trimmed;
  };

  return (
    <aside className="left-category-nav" aria-label="分类导航">
      <div className="left-category-nav-brand" aria-hidden="true">
        <span>4N</span>
      </div>

      <div className="left-category-nav-list">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`left-category-nav-item ${activeCategory === cat ? "active" : ""}`}
            onClick={() => onNavigate(cat)}
            title={cat}
            aria-label={cat}
          >
            <span>{getCategoryLabel(cat)}</span>
          </button>
        ))}
      </div>

      <a className="left-category-nav-setting" href="/admin" aria-label="管理后台" title="管理后台">
        <SettingOutlined />
      </a>
    </aside>
  );
};

export default LeftCategoryNav;
