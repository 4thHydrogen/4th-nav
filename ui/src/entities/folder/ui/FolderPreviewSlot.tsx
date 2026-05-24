import ToolIcon from "../../../shared/ui/ToolIcon";
import type { PreviewSlot } from "./folderPreview";
import type { Tool } from "../../../types";
import { useRef } from "react";
import { getJumpTarget } from "../../../utils/setting";

interface FolderPreviewSlotProps {
  slot: PreviewSlot;
  onOpenChild: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}

export function FolderPreviewSlot({ slot, onOpenChild, onContextMenu }: FolderPreviewSlotProps) {
  if (slot.type === "summary") {
    return (
      <div className="widget-folder-overflow">
        <div className="widget-folder-overflow-grid">
          {slot.tools!.slice(0, 3).map((tool) => (
            <span key={tool.id} className="widget-folder-overflow-cell">
              <ToolIcon
                logo={tool.logo}
                name={tool.name}
                fill
                fallbackFontSize={8}
              />
            </span>
          ))}
          {slot.count! > 0 && (
            <span className="widget-folder-overflow-count">+{slot.count}</span>
          )}
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
        <ToolIcon
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
