import { useMemo, useRef } from "react";
import ToolIcon from "../../../shared/ui/ToolIcon";
import type { LinkItem } from "../../panel/types";
import { getJumpTarget } from "../../../utils/setting";
import "./widget-tool.css";

interface WidgetToolProps {
  item: LinkItem;
  onContextMenu: (e: React.MouseEvent, item: LinkItem) => void;
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

const WidgetTool = ({ item, onContextMenu, onClick, compact = false, hideLabel = false, layout = "grid" }: WidgetToolProps) => {
  const [w, h] = parseSize(item.size);
  const isLarge = !compact && (w > 1 || h > 1);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const iconEl = useMemo(
    () => (
      <ToolIcon
        logo={item.logo}
        name={item.name}
        toolUrl={item.url}
        className="widget-tool-svg"
        fill
        dimWhileLoading
      />
    ),
    [item.logo, item.name, item.url]
  );

  const modeClass = compact
    ? layout === "list" ? "widget-tool-compact-list" : "widget-tool-compact"
    : layout === "list" ? "widget-tool-list"
    : isLarge ? "widget-tool-large" : "widget-tool-small";

  if (compact && layout === "list") {
    return (
      <a
        href={item.url}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, item); }}
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
        className={`widget-tool ${modeClass}`}
        title={item.name}
      >
        <div className="widget-tool-icon">{iconEl}</div>
        <div className="widget-tool-label" title={item.name}>{item.name}</div>
      </a>
    );
  }

  return (
    <a
      href={item.url}
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
      onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, item); }}
      onDragStart={(e) => e.preventDefault()}
      draggable={false}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      className={`widget-tool ${modeClass}`}
    >
      <div className="widget-tool-icon">{iconEl}</div>
      {!compact && !hideLabel && (
        <div className="widget-tool-label" title={item.name}>
          {item.name}
        </div>
      )}
      {isLarge && item.description && (
        <div className="widget-tool-desc" title={item.description}>
          {item.description}
        </div>
      )}
    </a>
  );
};

export default WidgetTool;
