import { useRef } from "react";
import { Folder } from "lucide-react";
import "./index.css";
import type { Tool } from "../../types";
import { parseSize } from "../WidgetTool";
import { FolderGridPreview } from "./FolderGridPreview";
import { FolderListPreview } from "./FolderListPreview";
import { FolderOpenButton } from "./FolderOpenButton";

interface WidgetFolderProps {
  folder: Tool;
  childrenTools: Tool[];
  listItemSize: number;
  onOpen: () => void;
  onOpenChild: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}

const WidgetFolder = ({ folder, childrenTools, listItemSize, onOpen, onOpenChild, onContextMenu }: WidgetFolderProps) => {

  const [w, h] = parseSize(folder.size);
  const isEmpty = childrenTools.length === 0;
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const folderTint = folder.folderTint || undefined;
  const isListMode = folder.folderViewMode === "list";

  return (
    <div className="widget-folder-outer" style={{ "--grid-w": w, "--grid-h": h } as React.CSSProperties}>
      <div
        className="widget-folder material-folder"
        style={{ "--folder-tint": folderTint || "transparent" } as React.CSSProperties}
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
        onAuxClick={(e) => { if (e.button === 1) e.preventDefault(); }}
        onContextMenu={(e) => onContextMenu(e, folder)}
      >
        {isEmpty ? (
          <div className="widget-folder-empty">
            <Folder size={20} />
          </div>
        ) : isListMode ? (
          <FolderListPreview
            childrenTools={childrenTools}
            itemSize={listItemSize}
            maxRows={h}
            onOpenChild={onOpenChild}
            onContextMenu={onContextMenu}
          />
        ) : (
          <FolderGridPreview
            childrenTools={childrenTools}
            cols={w}
            rows={h}
            onOpenChild={onOpenChild}
            onContextMenu={onContextMenu}
          />
        )}

        {isListMode && !isEmpty && (
          <FolderOpenButton onOpen={onOpen} />
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

export default WidgetFolder;
