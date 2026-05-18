import { useMemo, useState, useRef } from "react";
import { Folder } from "lucide-react";
import "./index.css";
import { getLogoUrl, isInlineSvg } from "../../utils/check";
import { getJumpTarget } from "../../utils/setting";
import type { Tool } from "../../types";
import { parseSize } from "../WidgetTool";

interface WidgetFolderProps {
  folder: Tool;
  childrenTools: Tool[];
  onOpen: () => void;
  onOpenChild: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}

const WidgetFolder = ({ folder, childrenTools, onOpen, onOpenChild, onContextMenu }: WidgetFolderProps) => {

  const [w, h] = parseSize(folder.size);
  const totalSlots = w * h;
  const isSmall = totalSlots <= 1;
  const isEmpty = childrenTools.length === 0;
  const fits = childrenTools.length <= totalSlots && !isSmall;
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const interactiveItems = fits
    ? childrenTools
    : isSmall
      ? []
      : childrenTools.slice(0, totalSlots - 1);
  const emptySlotCount = fits ? totalSlots - childrenTools.length : 0;
  const overflowItems = fits || isSmall
    ? isSmall ? childrenTools : []
    : childrenTools.slice(totalSlots - 1);

  const bgColor = folder.bgColor || undefined;

  return (
    <div className="widget-folder-outer" style={{ "--folder-w": w, "--folder-h": h } as React.CSSProperties}>
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
          onOpen();
        }}
        onAuxClick={(e) => {
          if (e.button === 1) e.preventDefault();
        }}
        onContextMenu={(e) => onContextMenu(e, folder)}
      >
        {isEmpty ? (
          <div className="widget-folder-empty">
            <Folder size={20} />
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
              <ChildIcon
                key={child.id}
                tool={child}
                onOpenChild={onOpenChild}
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

/**
 * 子图标 — 复用 WidgetTool 视觉规格（40px icon），用 <a href> 实现导航
 * 与外部散落图标体验一致：点击打开网页、中键新标签页、右键弹出 child 自己的菜单
 */
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
  const iconSrc = useMemo(() => {
    if (isInlineSvg(tool.logo)) return "";
    return getLogoUrl(tool.logo);
  }, [tool.logo]);

  return (
    <span className="widget-folder-overflow-cell">
      {!tool.logo || !iconSrc ? (
        <span className="widget-folder-overflow-char">{tool.name.charAt(0).toUpperCase()}</span>
      ) : (
        <img className="widget-folder-overflow-mini" src={iconSrc} alt="" loading="lazy" draggable={false} />
      )}
    </span>
  );
}

export default WidgetFolder;
