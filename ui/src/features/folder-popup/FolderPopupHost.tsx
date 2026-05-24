import { AnimatePresence } from "framer-motion";
import FolderFloatingWindow from "../../entities/folder/ui/FolderFloatingWindow";
import type { Tool } from "../../types";

interface FolderPopupHostProps {
  isOpen: boolean;
  folder: Tool | null;
  childrenTools: Tool[];
  listItemSize: number;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onOpenTool: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onMoveOut: (toolId: number) => void;
}

export function FolderPopupHost({
  isOpen,
  folder,
  childrenTools,
  listItemSize,
  anchorRect,
  onClose,
  onOpenTool,
  onContextMenu,
  onMoveOut,
}: FolderPopupHostProps) {
  return (
    <AnimatePresence>
      {isOpen && folder && (
        <FolderFloatingWindow
          key={folder.id}
          folder={folder}
          children={childrenTools}
          listItemSize={listItemSize}
          folderCardRect={anchorRect}
          onClose={onClose}
          onOpenTool={onOpenTool}
          onContextMenu={onContextMenu}
          onMoveOut={onMoveOut}
        />
      )}
    </AnimatePresence>
  );
}
