import { useMemo } from "react";
import ToolIcon from "../../../shared/ui/ToolIcon";
import { getJumpTarget } from "../../../utils/setting";
import type { LinkItem } from "../../panel/types";

interface FolderListPreviewProps {
  children: LinkItem[];
  itemSize: number;
  maxRows: number;
  onOpenChild: (item: LinkItem) => void;
  onChildContextMenu: (e: React.MouseEvent, item: LinkItem) => void;
}

export function FolderListPreview({
  children,
  itemSize,
  maxRows,
  onOpenChild,
  onChildContextMenu,
}: FolderListPreviewProps) {
  const visibleCount = useMemo(() => {
    const iconSize = 48;
    const folderGapY = 80 - iconSize + 12;
    const innerHeight = maxRows * iconSize + (maxRows - 1) * folderGapY - 12;
    return Math.max(1, Math.floor(innerHeight / itemSize));
  }, [maxRows, itemSize]);

  const overflow = Math.max(0, children.length - visibleCount);
  const visible = children.slice(0, visibleCount);

  return (
    <div
      className="widget-folder-list-preview"
      style={{ "--folder-list-item-size": `${itemSize}px` } as React.CSSProperties}
    >
      {visible.map((item) => (
        <FolderListPreviewItem
          key={item.id}
          item={item}
          itemSize={itemSize}
          onOpenChild={onOpenChild}
          onChildContextMenu={onChildContextMenu}
        />
      ))}
      {overflow > 0 && (
        <div className="widget-folder-list-overflow">···</div>
      )}
    </div>
  );
}

function FolderListPreviewItem({
  item,
  itemSize,
  onOpenChild,
  onChildContextMenu,
}: {
  item: LinkItem;
  itemSize: number;
  onOpenChild: (item: LinkItem) => void;
  onChildContextMenu: (e: React.MouseEvent, item: LinkItem) => void;
}) {
  return (
    <a
      className="widget-folder-list-item"
      href={item.url}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (item.url) {
          window.open(item.url, getJumpTarget() === "blank" ? "_blank" : "_self", "noopener,noreferrer");
        }
        onOpenChild(item);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onChildContextMenu(e, item);
      }}
      style={{ height: itemSize }}
    >
      <ToolIcon
        logo={item.logo}
        name={item.name}
        size={itemSize - 6}
        radius={3}
        className="widget-folder-list-item-icon"
        fallbackFontSize={8}
      />
      <span className="widget-folder-list-item-name">{item.name}</span>
    </a>
  );
}
