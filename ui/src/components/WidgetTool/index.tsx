import { useMemo, useState, useEffect, useRef } from "react";
import "./index.css";
import { getLogoUrl, isInlineSvg } from "../../utils/check";
import { sanitizeSvg } from "../../utils/sanitize";
import { getJumpTarget } from "../../utils/setting";
import type { Tool } from "../../types";

interface WidgetToolProps {
  tool: Tool;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onClick: () => void;
}

const parseSize = (size: string): [number, number] => {
  const parts = size.split("x").map(Number);
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    return [parts[0], parts[1]];
  }
  return [1, 1];
};

const WidgetTool = ({ tool, onContextMenu, onClick }: WidgetToolProps) => {
  const [w, h] = parseSize(tool.size);
  const isLarge = w > 1 || h > 1;
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [tool.logo]);

  const iconEl = useMemo(() => {
    if (imageError) {
      return (
        <div className="widget-tool-fallback">
          {tool.name.charAt(0).toUpperCase()}
        </div>
      );
    }
    if (isInlineSvg(tool.logo)) {
      return (
        <span
          className="widget-tool-svg"
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(tool.logo) }}
        />
      );
    }
    const imgSrc = tool.url === "admin" ? tool.logo : getLogoUrl(tool.logo);
    return (
      <img
        src={imgSrc}
        alt={tool.name}
        loading="lazy"
        draggable={false}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{ opacity: imageLoaded ? 1 : 0.3, transition: "opacity 0.3s ease" }}
      />
    );
  }, [tool.logo, tool.url, tool.name, imageLoaded, imageError]);

  return (
    <a
      href={tool.url}
      onMouseDown={(e) => { mouseDownPos.current = { x: e.clientX, y: e.clientY }; }}
      onClick={(e) => {
        if (mouseDownPos.current) {
          const dx = e.clientX - mouseDownPos.current.x;
          const dy = e.clientY - mouseDownPos.current.y;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            e.preventDefault();
            return;
          }
        }
        onClick();
      }}
      onContextMenu={(e) => onContextMenu(e, tool)}
      onDragStart={(e) => e.preventDefault()}
      draggable={false}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      className={`widget-tool ${isLarge ? "widget-tool-large" : "widget-tool-small"}`}
    >
      <div className="widget-tool-icon">
        {iconEl}
      </div>
      <div className="widget-tool-label" title={tool.name}>
        {tool.name}
      </div>
      {isLarge && tool.desc && (
        <div className="widget-tool-desc" title={tool.desc}>
          {tool.desc}
        </div>
      )}
    </a>
  );
};

export default WidgetTool;
export { parseSize };
