import "./index.css";

interface LeftCategoryNavProps {
  categories: string[];
  activeCategory: string;
  onNavigate: (category: string) => void;
}

const LeftCategoryNav = ({ categories, activeCategory, onNavigate }: LeftCategoryNavProps) => {
  return (
    <div className="left-category-nav">
      {categories.map((cat) => (
        <span
          key={cat}
          className={`left-category-nav-item ${activeCategory === cat ? "active" : ""}`}
          onClick={() => onNavigate(cat)}
          title={cat}
        >
          {cat}
        </span>
      ))}
    </div>
  );
};

export default LeftCategoryNav;
