import { useMemo } from "react";
import LogoIcon from "../../shared/components/LogoIcon";
import { getJumpTarget } from "../../utils/setting";
import type { Tool } from "../../types";

interface FolderListPreviewProps {
  childrenTools: Tool[];
  itemSize: number;
  maxRows: number;
  onOpenChild: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}

export function FolderListPreview({
  childrenTools,
  itemSize,
  maxRows,
  onOpenChild,
  onContextMenu,
}: FolderListPreviewProps) {
  const visibleCount = useMemo(() => {
    const iconSize = 48;
    const folderGapY = 80 - iconSize + 12;
    const innerHeight = maxRows * iconSize + (maxRows - 1) * folderGapY - 12;
    return Math.max(1, Math.floor(innerHeight / itemSize));
  }, [maxRows, itemSize]);

  const overflow = Math.max(0, childrenTools.length - visibleCount);
  const visible = childrenTools.slice(0, visibleCount);

  return (
    <div
      className="widget-folder-list-preview"
      style={{ "--folder-list-item-size": `${itemSize}px` } as React.CSSProperties}
      onClick={(e) => e.stopPropagation()}
    >
      {visible.map((child) => (
        <FolderListPreviewItem
          key={child.id}
          tool={child}
          itemSize={itemSize}
          onOpenChild={onOpenChild}
          onContextMenu={onContextMenu}
        />
      ))}
      {overflow > 0 && (
        <div className="widget-folder-list-overflow">+{overflow}</div>
      )}
    </div>
  );
}

function FolderListPreviewItem({
  tool,
  itemSize,
  onOpenChild,
  onContextMenu,
}: {
  tool: Tool;
  itemSize: number;
  onOpenChild: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}) {
  return (
    <a
      className="widget-folder-list-item"
      href={tool.url}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (tool.url) {
          window.open(tool.url, getJumpTarget() === "blank" ? "_blank" : "_self", "noopener,noreferrer");
        }
        onOpenChild(tool);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e, tool);
      }}
      style={{ height: itemSize }}
    >
      <LogoIcon
        logo={tool.logo}
        name={tool.name}
        size={itemSize - 6}
        radius={3}
        className="widget-folder-list-item-icon"
        fallbackFontSize={8}
      />
      <span className="widget-folder-list-item-name">{tool.name}</span>
    </a>
  );
}
