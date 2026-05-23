import LogoIcon from "../../shared/components/LogoIcon";
import type { PreviewSlot } from "./folderPreview";
import type { Tool } from "../../types";
import { useRef } from "react";
import { getJumpTarget } from "../../utils/setting";

interface FolderPreviewSlotProps {
  slot: PreviewSlot;
  onOpenChild: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}

export function FolderPreviewSlot({ slot, onOpenChild, onContextMenu }: FolderPreviewSlotProps) {
  if (slot.type === "overflow") {
    return (
      <div className="widget-folder-overflow">
        <div className="widget-folder-overflow-grid">
          <span className="widget-folder-overflow-label">+{slot.count}</span>
        </div>
      </div>
    );
  }

  if (slot.type === "empty") {
    return <div className="widget-folder-slot-empty" />;
  }

  // tool slot
  const tool = slot.tool!;
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

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
        <LogoIcon
          logo={tool.logo}
          name={tool.name}
          fill
          radius={6}
          fallbackFontSize={14}
        />
      </span>
    </a>
  );
}

/** Mini icon used in 1×1 folder overflow cells */
export function FolderMiniIcon({ tool }: { tool: Tool }) {
  return (
    <LogoIcon
      logo={tool.logo}
      name={tool.name}
      fill
      className="widget-folder-overflow-cell"
      fallbackFontSize={10}
    />
  );
}

/** Overflow slot showing "+N" inside a mini grid */
export function FolderOverflowSlot({ count }: { count: number }) {
  return (
    <div className="widget-folder-overflow">
      <span className="widget-folder-overflow-label">+{count}</span>
    </div>
  );
}
