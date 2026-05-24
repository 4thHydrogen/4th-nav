import { useMemo, useState, useEffect } from "react";
import ToolIcon from "../../shared/ui/ToolIcon";
import type { Tool, ToolViewMode } from "../../types";
import { getNameColor } from "../../utils/name-color";
import { getJumpTarget } from "../../utils/setting";
import "./index.css";

interface ToolItemProps {
  tool: Tool;
  index: number;
  isSearching: boolean;
  noImageMode: boolean;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onClick: () => void;
}

const ToolItem = ({ tool, index, isSearching, noImageMode, onContextMenu, onClick }: ToolItemProps) => {
  const viewMode: ToolViewMode = tool.viewMode === "card" ? "card" : "icon";

  const [imageError, setImageError] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    setImageError(false);
    setShowLoading(true);
    const timeout = setTimeout(() => setShowLoading(false), 10000);
    return () => clearTimeout(timeout);
  }, [tool.logo]);

  const iconEl = useMemo(() => {
    if (imageError) {
      return (
        <div
          className="tool-item-icon-fallback tool-item-icon-fallback-colored"
          style={{ backgroundColor: getNameColor(tool.name) }}
        >
          {tool.name.charAt(0).toUpperCase()}
        </div>
      );
    }

    return (
      <>
        {showLoading && <div className="tool-item-spinner" />}
        <ToolIcon
          logo={tool.logo}
          name={tool.name}
          toolUrl={tool.url}
          className="tool-item-inline-svg"
          fill
          dimWhileLoading
        />
      </>
    );
  }, [imageError, showLoading, tool.logo, tool.name, tool.url]);

  const showNumIndex = index < 10 && isSearching;

  return (
    <a
      href={tool.url}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, tool)}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      className={`tool-item tool-item-${viewMode}`}
    >
      {showNumIndex && <span className="tool-item-index">{index + 1}</span>}
      {!noImageMode && (
        <div className="tool-item-icon-wrap">
          {iconEl}
        </div>
      )}
      <div className="tool-item-info">
        <div className="tool-item-title" title={tool.name}>{tool.name}</div>
        {viewMode === "card" && (
          <>
            <div className="tool-item-category">{tool.category || "未分类"}</div>
            <div className="tool-item-desc" title={tool.description}>{tool.description}</div>
          </>
        )}
      </div>
    </a>
  );
};

export default ToolItem;
