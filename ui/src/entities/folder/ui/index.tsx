import { useRef } from "react";
import { Folder } from "lucide-react";
import "./index.css";
import type { FolderItem, LinkItem } from "../../panel/types";
import { parseSize } from "../../tool/ui/WidgetTool";
import { FolderGridPreview } from "./FolderGridPreview";
import { FolderListPreview } from "./FolderListPreview";
import { FolderOpenButton } from "./FolderOpenButton";

interface WidgetFolderProps {
  folder: FolderItem;
  listItemSize: number;
  onOpen: () => void;
  onOpenChild: (item: LinkItem) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onChildContextMenu: (e: React.MouseEvent, item: LinkItem) => void;
}

const WidgetFolder = ({ folder, listItemSize, onOpen, onOpenChild, onContextMenu, onChildContextMenu }: WidgetFolderProps) => {
  const [w, h] = parseSize(folder.size);
  const isEmpty = folder.children.length === 0;
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
            folder.children.forEach((child) => {
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
        onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e); }}
      >
        {isEmpty ? (
          <div className="widget-folder-empty">
            <Folder size={20} />
          </div>
        ) : isListMode ? (
          <FolderListPreview
            children={folder.children}
            itemSize={listItemSize}
            maxRows={h}
            onOpenChild={onOpenChild}
            onChildContextMenu={onChildContextMenu}
          />
        ) : (
          <FolderGridPreview
            children={folder.children}
            cols={w}
            rows={h}
            onOpenChild={onOpenChild}
            onChildContextMenu={onChildContextMenu}
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
