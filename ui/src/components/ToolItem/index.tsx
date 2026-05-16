import { useMemo, useState, useEffect } from "react";
import "./index.css";
import { getLogoUrl } from "../../utils/check";
import { getJumpTarget } from "../../utils/setting";
import type { Tool, ToolViewMode } from "../../types";

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

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  const imageSrc = useMemo(() => {
    return tool.url === "admin" ? tool.logo : getLogoUrl(tool.logo);
  }, [tool.logo, tool.url]);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setShowLoading(true);
    const timeout = setTimeout(() => setShowLoading(false), 10000);
    return () => clearTimeout(timeout);
  }, [imageSrc]);

  const iconEl = useMemo(() => {
    if (imageError) {
      return (
        <div className="tool-item-icon-fallback">
          {tool.name.charAt(0).toUpperCase()}
        </div>
      );
    }
    return (
      <>
        {showLoading && !imageLoaded && <div className="tool-item-spinner" />}
        <img
          src={imageSrc}
          alt={tool.name}
          loading="lazy"
          onLoad={() => { setImageLoaded(true); setShowLoading(false); }}
          onError={() => { setImageError(true); setShowLoading(false); }}
          style={{ opacity: imageLoaded ? 1 : 0.1, transition: "opacity 0.3s ease" }}
        />
      </>
    );
  }, [imageSrc, tool.name, imageLoaded, imageError, showLoading]);

  const showNumIndex = index < 10 && isSearching;

  return (
    <a
      href={tool.url === "toggleJumpTarget" ? undefined : tool.url}
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
            <div className="tool-item-category">{tool.catelog || "未分类"}</div>
            <div className="tool-item-desc" title={tool.desc}>{tool.desc}</div>
          </>
        )}
      </div>
    </a>
  );
};

export default ToolItem;
