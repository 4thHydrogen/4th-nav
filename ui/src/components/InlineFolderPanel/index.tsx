import type { Tool } from "../../types";
import ToolItem from "../ToolItem";
import "./index.css";

interface InlineFolderPanelProps {
  folder: Tool;
  items: Tool[];
  noImageMode: boolean;
  onOpenTool: (tool: Tool) => void;
  onClose: () => void;
}

const InlineFolderPanel = ({
  folder,
  items,
  noImageMode,
  onOpenTool,
  onClose,
}: InlineFolderPanelProps) => {
  return (
    <div
      className="inline-folder-panel"
      onClick={(e) => e.stopPropagation()}
      style={folder.bgColor ? { backgroundColor: folder.bgColor } : undefined}
    >
      <div className="inline-folder-header">
        <span className="inline-folder-title">{folder.name}</span>
        <button className="inline-folder-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="inline-folder-grid">
        {items.map((item, index) => (
          <ToolItem
            key={item.id}
            tool={item}
            index={index}
            isSearching={false}
            noImageMode={noImageMode}
            onContextMenu={() => {}}
            onClick={() => onOpenTool(item)}
          />
        ))}
      </div>
    </div>
  );
};

export default InlineFolderPanel;
