import { useMemo, useState } from "react";
import { getLogoUrl, isInlineSvg } from "../../utils/check";
import { getJumpTarget } from "../../utils/setting";
import type { Tool } from "../../types";
import "./index.css";

interface ListToolItemProps {
  tool: Tool;
  itemSize: number;
  onOpen?: (tool: Tool) => void;
  onContextMenu?: (e: React.MouseEvent, tool: Tool) => void;
}

const ListToolItem = ({ tool, itemSize, onOpen, onContextMenu }: ListToolItemProps) => {
  const [error, setError] = useState(false);
  const iconSrc = useMemo(() => {
    if (isInlineSvg(tool.logo)) return "";
    return getLogoUrl(tool.logo);
  }, [tool.logo]);

  return (
    <a
      className="list-tool-item"
      href={tool.url}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      title={tool.name}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen?.(tool);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu?.(e, tool);
      }}
      style={{ height: itemSize, "--item-size": `${itemSize}px` } as React.CSSProperties}
    >
      <span className="list-tool-item-icon" style={{ width: itemSize - 8, height: itemSize - 8 }}>
        {error || !tool.logo || !iconSrc ? (
          <span className="list-tool-item-fallback">{tool.name.charAt(0).toUpperCase()}</span>
        ) : (
          <img src={iconSrc} alt={tool.name} loading="lazy" draggable={false} onError={() => setError(true)} />
        )}
      </span>
      <span className="list-tool-item-name">{tool.name}</span>
    </a>
  );
};

export default ListToolItem;
