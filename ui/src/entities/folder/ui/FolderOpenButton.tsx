import { Folder } from "lucide-react";

interface FolderOpenButtonProps {
  onOpen: () => void;
}

export function FolderOpenButton({ onOpen }: FolderOpenButtonProps) {
  return (
    <button
      type="button"
      className="widget-folder-open-trigger"
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpen();
      }}
      title="打开文件夹"
    >
      <Folder size={12} />
    </button>
  );
}
