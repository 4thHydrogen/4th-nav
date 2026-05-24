import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUpdateToolSize } from "../../queries";
import type { Tool, ToolViewMode } from "../../types";
import { getContextMenuFolders, getNextViewMode } from "./model";
import { ToolContextMenuView } from "./ToolContextMenuView";
import { useToolContextMenuActions } from "./useToolContextMenuActions";
import "./index.css";

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
  onAddToDock: (tool: Tool) => void;
  isInDock: (toolId: number) => boolean;
  allTools?: Tool[];
  onRefresh?: () => void;
}

const ToolContextMenu = ({
  state,
  onClose,
  onViewModeChange,
  onAddToDock,
  isInDock,
  allTools = [],
  onRefresh,
}: ToolContextMenuProps) => {
  const { visible, x, y, tool } = state;
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const updateToolSize = useUpdateToolSize();
  const effectiveTool =
    tool ??
    ({
      id: -1,
      name: "",
      url: "",
      logo: "",
      category: "",
      description: "",
      sort: 0,
      hide: false,
      viewMode: "icon",
      type: "icon",
      parentId: null,
      size: "1x1",
      folderTint: "",
      gridX: -1,
      gridY: -1,
      folderViewMode: "grid",
      folderItemSize: 28,
    } satisfies Tool);

  const handleClickOutside = useCallback(() => {
    setShowFolderPicker(false);
    setShowSizePicker(false);
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowFolderPicker(false);
        setShowSizePicker(false);
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, handleClickOutside, handleKeyDown]);

  const actions = useToolContextMenuActions({
    tool: effectiveTool,
    onClose,
    onRefresh,
    onViewModeChange,
    onAddToDock,
    updateToolSize,
  });

  if (!visible || !tool) {
    return null;
  }

  const nextViewMode = getNextViewMode(tool.viewMode);
  const canDock = tool.type !== "folder";
  const folders = getContextMenuFolders(allTools, tool);

  return createPortal(
    <div
      className="tool-context-menu"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      <ToolContextMenuView
        tool={tool}
        nextViewMode={nextViewMode}
        canDock={canDock}
        isDocked={isInDock(tool.id)}
        folders={folders}
        showFolderPicker={showFolderPicker}
        showSizePicker={showSizePicker}
        onToggleFolderPicker={setShowFolderPicker}
        onToggleSizePicker={setShowSizePicker}
        onToggleViewMode={actions.handleToggleViewMode}
        onOpenInNewTab={actions.handleOpenInNewTab}
        onCopyUrl={actions.handleCopyUrl}
        onAddToDock={actions.handleAddToDock}
        onRemoveFromFolder={actions.handleRemoveFromFolder}
        onCreateFolder={actions.handleCreateFolder}
        onMoveToFolder={actions.handleMoveToFolder}
        onRename={actions.handleRename}
        onDeleteFolder={actions.handleDeleteFolder}
        onSetSize={actions.handleSetSize}
      />
    </div>,
    document.body
  );
};

export default ToolContextMenu;
