import { AnimatePresence } from "framer-motion";
import FolderFloatingWindow from "../../entities/folder/ui/FolderFloatingWindow";
import type { FolderItem, LinkItem } from "../../entities/panel/types";

interface FolderPopupHostProps {
  isOpen: boolean;
  folder: FolderItem | null;
  listItemSize: number;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onOpenTool: (item: LinkItem) => void;
  onContextMenu: (e: React.MouseEvent, item: LinkItem) => void;
  onMoveOut: (toolId: number) => void;
}

export function FolderPopupHost({
  isOpen,
  folder,
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
