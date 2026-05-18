import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import "./index.css";
import type { Tool } from "../../types";
import ToolItem from "../ToolItem";

interface FolderOverlayProps {
  folder: Tool;
  items: Tool[];
  noImageMode: boolean;
  onOpenTool: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onClose: () => void;
}

const FolderOverlay = ({ folder, items, noImageMode, onOpenTool, onContextMenu, onClose }: FolderOverlayProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const el = (
    <div className="folder-overlay-backdrop" onClick={onClose}>
      <div className="folder-overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="folder-overlay-header">
          <h3 className="folder-overlay-title">{folder.name}</h3>
          <button className="folder-overlay-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="folder-overlay-grid">
          {items.map((tool, idx) => (
            <ToolItem
              key={tool.id}
              tool={tool}
              index={idx}
              isSearching={false}
              noImageMode={noImageMode}
              onContextMenu={onContextMenu}
              onClick={() => onOpenTool(tool)}
            />
          ))}
        </div>
        {items.length === 0 && (
          <div className="folder-overlay-empty">文件夹为空</div>
        )}
      </div>
    </div>
  );

  return createPortal(el, document.body);
};

export default FolderOverlay;
