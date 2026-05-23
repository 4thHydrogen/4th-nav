import { Folder } from "lucide-react";

interface FolderOpenButtonProps {
  onOpen: () => void;
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
        onOpen();
      }}
      title="打开文件夹"
    >
      <Folder size={12} />
    </button>
  );
}
