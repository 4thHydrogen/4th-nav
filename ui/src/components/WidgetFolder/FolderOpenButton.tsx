import { Folder } from "lucide-react";

interface FolderOpenButtonProps {
  onOpen: (mouseX: number, mouseY: number) => void;
}

export function FolderOpenButton({ onOpen }: FolderOpenButtonProps) {
  return (
    <button
      type="button"
      className="widget-folder-open-trigger"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen(e.clientX, e.clientY);
      }}
      title="打开文件夹"
    >
      <Folder size={12} />
    </button>
  );
}
