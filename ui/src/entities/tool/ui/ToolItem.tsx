import { useEffect, useMemo, useState } from "react";
import type { Tool, ToolViewMode } from "../../../types";
import ToolIcon from "../../../shared/ui/ToolIcon";
import { getJumpTarget } from "../../../utils/setting";
import "./tool-item.css";

interface ToolItemProps {
  tool: Tool;
  index: number;
  isSearching: boolean;
  noImageMode: boolean;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onClick: () => void;
}

const ToolItem = ({
  tool,
  index,
  isSearching,
  noImageMode,
  onContextMenu,
  onClick,
}: ToolItemProps) => {
  const viewMode: ToolViewMode = tool.viewMode === "card" ? "card" : "icon";
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    setShowLoading(true);
    const timeout = setTimeout(() => setShowLoading(false), 10000);
    return () => clearTimeout(timeout);
  }, [tool.logo]);

  const iconEl = useMemo(() => {
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
  }, [showLoading, tool.logo, tool.name, tool.url]);

  const showNumIndex = index < 10 && isSearching;

  return (
    <a
      href={tool.url}
      onClick={onClick}
      onContextMenu={(event) => onContextMenu(event, tool)}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      className={`tool-item tool-item-${viewMode}`}
    >
      {showNumIndex && <span className="tool-item-index">{index + 1}</span>}
      {!noImageMode && <div className="tool-item-icon-wrap">{iconEl}</div>}
      <div className="tool-item-info">
        <div className="tool-item-title" title={tool.name}>
          {tool.name}
        </div>
        {viewMode === "card" && (
          <>
            <div className="tool-item-category">{tool.category || "未分类"}</div>
            <div className="tool-item-desc" title={tool.description}>
              {tool.description}
            </div>
          </>
        )}
      </div>
    </a>
  );
};

export default ToolItem;
