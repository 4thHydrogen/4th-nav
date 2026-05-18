import { useMemo, useState, useEffect } from "react";
import "./index.css";
import { getLogoUrl, isInlineSvg } from "../../utils/check";
import { sanitizeSvg } from "../../utils/sanitize";
import { getJumpTarget } from "../../utils/setting";
import { getNameColor } from "../../utils/name-color";
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

  useEffect(() => {
    setImageLoaded(false);
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

    if (isInlineSvg(tool.logo)) {
      return (
        <span
          className="tool-item-inline-svg"
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(tool.logo) }}
        />
      );
    }

    const imgSrc = tool.url === "admin" ? tool.logo : getLogoUrl(tool.logo);
    return (
      <>
        {showLoading && !imageLoaded && <div className="tool-item-spinner" />}
        <img
          src={imgSrc}
          alt={tool.name}
          loading="lazy"
          onLoad={() => { setImageLoaded(true); setShowLoading(false); }}
          onError={() => { setImageError(true); setShowLoading(false); }}
          style={{ opacity: imageLoaded ? 1 : 0.1, transition: "opacity 0.3s ease" }}
        />
      </>
    );
  }, [tool.logo, tool.url, tool.name, imageLoaded, imageError, showLoading]);

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
            <div className="tool-item-category">{tool.catelog || "未分类"}</div>
            <div className="tool-item-desc" title={tool.desc}>{tool.desc}</div>
          </>
        )}
      </div>
    </a>
  );
};

export default ToolItem;
