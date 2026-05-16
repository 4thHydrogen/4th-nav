import { useEffect, useCallback } from "react";
import "./index.css";
import type { Tool, ToolViewMode } from "../../types";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tool: Tool | null;
}

interface ToolContextMenuProps {
  state: ContextMenuState;
  onClose: () => void;
  onViewModeChange: (tool: Tool, nextMode: ToolViewMode) => void;
}

const ToolContextMenu = ({ state, onClose, onViewModeChange }: ToolContextMenuProps) => {
  const { visible, x, y, tool } = state;

  const handleClickOutside = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!visible) return;
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, handleClickOutside, handleKeyDown]);

  if (!visible || !tool) return null;

  const nextViewMode: ToolViewMode = tool.viewMode === "card" ? "icon" : "card";

  const menuStyle: React.CSSProperties = {
    left: x,
    top: y,
  };

  return (
    <div className="tool-context-menu" style={menuStyle} onClick={(e) => e.stopPropagation()}>
      <div className="tool-context-menu-title">{tool.name}</div>
      <button
        className="tool-context-menu-item"
        onClick={() => {
          onViewModeChange(tool, nextViewMode);
          onClose();
        }}
      >
        {nextViewMode === "icon" ? "切换为图标模式" : "切换为卡片模式"}
      </button>
      <button
        className="tool-context-menu-item"
        onClick={() => {
          window.open(tool.url, "_blank");
          onClose();
        }}
      >
        新标签页打开
      </button>
      <button
        className="tool-context-menu-item"
        onClick={() => {
          navigator.clipboard.writeText(tool.url);
          onClose();
        }}
      >
        复制链接
      </button>
    </div>
  );
};

export default ToolContextMenu;
