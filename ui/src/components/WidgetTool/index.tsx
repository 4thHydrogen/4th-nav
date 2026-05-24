import { useMemo, useRef } from "react";
import ToolIcon from "../../shared/ui/ToolIcon";
import type { Tool } from "../../types";
import { getJumpTarget } from "../../utils/setting";
import "./index.css";

interface WidgetToolProps {
  tool: Tool;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onClick: () => void;
  compact?: boolean;
  hideLabel?: boolean;
  layout?: "grid" | "list";
}

export const parseSize = (size: string): [number, number] => {
  const parts = size.split("x").map(Number);
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    return [parts[0], parts[1]];
  }
  return [1, 1];
};

const WidgetTool = ({ tool, onContextMenu, onClick, compact = false, hideLabel = false, layout = "grid" }: WidgetToolProps) => {
  const [w, h] = parseSize(tool.size);
  const isLarge = !compact && (w > 1 || h > 1);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const iconEl = useMemo(
    () => (
      <ToolIcon
        logo={tool.logo}
        name={tool.name}
        toolUrl={tool.url}
        className="widget-tool-svg"
        fill
        dimWhileLoading
      />
    ),
    [tool.logo, tool.name, tool.url]
  );

  const modeClass = compact
    ? layout === "list" ? "widget-tool-compact-list" : "widget-tool-compact"
    : layout === "list" ? "widget-tool-list"
    : isLarge ? "widget-tool-large" : "widget-tool-small";

  if (compact && layout === "list") {
    return (
      <a
        href={tool.url}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, tool); }}
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
        className={`widget-tool ${modeClass}`}
        title={tool.name}
      >
        <div className="widget-tool-icon">{iconEl}</div>
        <div className="widget-tool-label" title={tool.name}>{tool.name}</div>
      </a>
    );
  }

  return (
    <a
      href={tool.url}
      onMouseDown={(e) => { e.stopPropagation(); mouseDownPos.current = { x: e.clientX, y: e.clientY }; }}
      onClick={(e) => {
        e.stopPropagation();
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
      onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, tool); }}
      onDragStart={(e) => e.preventDefault()}
      draggable={false}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      className={`widget-tool ${modeClass}`}
    >
      <div className="widget-tool-icon">{iconEl}</div>
      {!compact && !hideLabel && (
        <div className="widget-tool-label" title={tool.name}>
          {tool.name}
        </div>
      )}
      {isLarge && tool.description && (
        <div className="widget-tool-desc" title={tool.description}>
          {tool.description}
        </div>
      )}
    </a>
  );
};

export default WidgetTool;
