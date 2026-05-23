import { useMemo, useState, useRef } from "react";
import { Folder } from "lucide-react";
import "./index.css";
import { getLogoUrl, isInlineSvg } from "../../utils/check";
import { getJumpTarget } from "../../utils/setting";
import WidgetTool from "../WidgetTool";
import type { Tool } from "../../types";
import { parseSize } from "../WidgetTool";

interface WidgetFolderProps {
  folder: Tool;
  childrenTools: Tool[];
  listItemSize: number;
  onOpen: (mouseX: number, mouseY: number) => void;
  onOpenChild: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}

const WidgetFolder = ({ folder, childrenTools, listItemSize, onOpen, onOpenChild, onContextMenu }: WidgetFolderProps) => {

  const [w, h] = parseSize(folder.size);
  const totalSlots = w * h;
  const isSmall = totalSlots <= 1;
  const isEmpty = childrenTools.length === 0;
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const bgColor = folder.bgColor || undefined;
  const isListMode = folder.folderViewMode === "list";

  const interactiveItems = (() => {
    if (isListMode) return [];
    const fits = childrenTools.length <= totalSlots && !isSmall;
    return fits ? childrenTools : isSmall ? [] : childrenTools.slice(0, totalSlots - 1);
  })();
  const emptySlotCount = (() => {
    if (isListMode) return 0;
    const fits = childrenTools.length <= totalSlots && !isSmall;
    return fits ? totalSlots - childrenTools.length : 0;
  })();
  const overflowItems = (() => {
    if (isListMode) return [];
    const fits = childrenTools.length <= totalSlots && !isSmall;
    return fits || isSmall ? isSmall ? childrenTools : [] : childrenTools.slice(totalSlots - 1);
  })();

  return (
    <div className="widget-folder-outer" style={{ "--grid-w": w, "--grid-h": h } as React.CSSProperties}>
      <div
        className="widget-folder"
        style={{ backgroundColor: bgColor }}
        onMouseDown={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            childrenTools.forEach((child) => {
              if (child.url) window.open(child.url, "_blank", "noopener,noreferrer");
            });
            return;
          }
          mouseDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={(e) => {
          if (mouseDownPos.current) {
            const dx = e.clientX - mouseDownPos.current.x;
            const dy = e.clientY - mouseDownPos.current.y;
            mouseDownPos.current = null;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) return;
          }
          onOpen(e.clientX, e.clientY);
        }}
        onAuxClick={(e) => { if (e.button === 1) e.preventDefault(); }}
        onContextMenu={(e) => onContextMenu(e, folder)}
      >
        {isEmpty ? (
          <div className="widget-folder-empty">
            <Folder size={20} />
          </div>
        ) : isListMode ? (
          <div
            className="widget-folder-list-preview widget-folder-list-scrollable"
            style={{ "--folder-list-item-size": `${listItemSize}px` } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            {childrenTools.map((child) => (
              <FolderListPreviewItem
                key={child.id}
                tool={child}
                itemSize={listItemSize}
                onOpenChild={onOpenChild}
                onContextMenu={onContextMenu}
              />
            ))}
            <div
              className="widget-folder-open-trigger"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpen(e.clientX, e.clientY);
              }}
            >
              <Folder size={12} />
            </div>
          </div>
        ) : (
          <div
            className="widget-folder-preview"
            style={{
              gridTemplateColumns: `repeat(${Math.max(w, 1)}, 1fr)`,
              gridTemplateRows: `repeat(${Math.max(h, 1)}, 1fr)`,
            }}
          >
            {interactiveItems.map((child) => (
              <WidgetTool
                key={child.id}
                tool={child}
                hideLabel
                onClick={() => onOpenChild(child)}
                onContextMenu={onContextMenu}
              />
            ))}
            {Array.from({ length: emptySlotCount }).map((_, i) => (
              <div key={`empty-${i}`} className="widget-folder-slot-empty" />
            ))}
            {overflowItems.length > 0 && (
              <div className="widget-folder-overflow">
                <div className="widget-folder-overflow-grid">
                  {overflowItems.slice(0, 4).map((child) => (
                    <MiniIcon key={child.id} tool={child} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {folder.name && (
        <div className="widget-folder-label" title={folder.name}>
          {folder.name}
        </div>
      )}
    </div>
  );
};

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
  const iconSrc = useMemo(() => {
    if (isInlineSvg(tool.logo)) return "";
    return getLogoUrl(tool.logo);
  }, [tool.logo]);

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
        onOpenChild(tool);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e, tool);
      }}
      style={{ height: itemSize }}
    >
      <span className="widget-folder-list-item-icon" style={{ width: itemSize - 6, height: itemSize - 6 }}>
        {!tool.logo || !iconSrc ? (
          <span className="widget-folder-list-item-char">{tool.name.charAt(0).toUpperCase()}</span>
        ) : (
          <img src={iconSrc} alt="" loading="lazy" draggable={false} />
        )}
      </span>
      <span className="widget-folder-list-item-name">{tool.name}</span>
    </a>
  );
}

function ChildIcon({
  tool,
  onOpenChild,
  onContextMenu,
}: {
  tool: Tool;
  onOpenChild: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}) {
  const [error, setError] = useState(false);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const iconSrc = useMemo(() => {
    if (isInlineSvg(tool.logo)) return "";
    return getLogoUrl(tool.logo);
  }, [tool.logo]);

  return (
    <a
      className="widget-folder-child"
      href={tool.url}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      title={tool.name}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={(e) => {
        e.stopPropagation();
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (mouseDownPos.current) {
          const dx = e.clientX - mouseDownPos.current.x;
          const dy = e.clientY - mouseDownPos.current.y;
          mouseDownPos.current = null;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            e.preventDefault();
            return;
          }
        }
        onOpenChild(tool);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e, tool);
      }}
    >
      <span className="widget-folder-child-icon">
        {error || !tool.logo ? (
          <span className="widget-folder-child-fallback">
            {tool.name.charAt(0).toUpperCase()}
          </span>
        ) : iconSrc ? (
          <img
            src={iconSrc}
            alt={tool.name}
            loading="lazy"
            draggable={false}
            onError={() => setError(true)}
          />
        ) : (
          <span className="widget-folder-child-fallback">
            {tool.name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
    </a>
  );
}

function MiniIcon({ tool }: { tool: Tool }) {
  const [error, setError] = useState(false);
  const iconSrc = useMemo(() => {
    if (isInlineSvg(tool.logo)) return "";
    return getLogoUrl(tool.logo);
  }, [tool.logo]);

  return (
    <span className="widget-folder-overflow-cell">
      {!tool.logo || !iconSrc || error ? (
        <span className="widget-folder-overflow-char">{tool.name.charAt(0).toUpperCase()}</span>
      ) : (
        <img className="widget-folder-overflow-mini" src={iconSrc} alt="" loading="lazy" draggable={false} onError={() => setError(true)} />
      )}
    </span>
  );
}

export default WidgetFolder;
