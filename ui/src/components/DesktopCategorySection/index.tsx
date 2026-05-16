import type { Tool } from "../../types";
import ToolItem from "../ToolItem";
import "./index.css";

interface DesktopCategorySectionProps {
  category: string;
  items: Tool[];
  isSearching: boolean;
  noImageMode: boolean;
  onToolContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onToolClick: (tool: Tool) => void;
}

const DesktopCategorySection = ({
  category,
  items,
  isSearching,
  noImageMode,
  onToolContextMenu,
  onToolClick,
}: DesktopCategorySectionProps) => {
  return (
    <section id={`category-${category}`} className="desktop-category-section">
      <h2 className="desktop-category-title">{category}</h2>
      <div className="desktop-tool-grid">
        {items.map((item, index) => (
          <ToolItem
            key={item.id}
            tool={item}
            index={index}
            isSearching={isSearching}
            noImageMode={noImageMode}
            onContextMenu={onToolContextMenu}
            onClick={() => onToolClick(item)}
          />
        ))}
      </div>
    </section>
  );
};

export default DesktopCategorySection;
