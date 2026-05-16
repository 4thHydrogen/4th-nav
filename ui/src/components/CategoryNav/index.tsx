import { useLayoutEffect, useRef, useState } from "react";
import "./index.css";

interface CategoryNavProps {
  categories: string[];
  activeCategory: string;
  onNavigate: (category: string) => void;
}

const CategoryNav = ({ categories, activeCategory, onNavigate }: CategoryNavProps) => {
  const navRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    const update = () => {
      const gridEl = document.querySelector(".grouped-content");
      if (!gridEl || !navRef.current) return;
      const gridLeft = gridEl.getBoundingClientRect().left;
      const navWidth = navRef.current.offsetWidth;
      setStyle({
        left: gridLeft - navWidth - 8,
        top: "50%",
        transform: "translateY(-50%)",
      });
    };

    // 延迟一帧确保 grid 布局完成
    requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [categories]);

  return (
    <div className="category-nav" ref={navRef} style={style}>
      {categories.map((cat) => (
        <span
          key={cat}
          className={`category-nav-item ${activeCategory === cat ? "active" : ""}`}
          onClick={() => onNavigate(cat)}
        >
          {cat}
        </span>
      ))}
    </div>
  );
};

export default CategoryNav;
