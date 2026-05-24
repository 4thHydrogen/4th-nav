import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { fetchMoveToolToFolder, fetchDeleteFolder } from "../../shared/api/folder";
import { fetchAddTool, fetchUpdateTool } from "../../shared/api/tool";
import type { Tool, ToolSize, ToolViewMode } from "../../types";
import { useUpdateToolSize } from "../../queries";
import "./index.css";

const toUpdateDto = (tool: Tool) => ({
  ...tool,
  category: tool.category || "",
  description: tool.description || "",
  folderTint: tool.folderTint || "",
});

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

const FOLDER_SIZES: ToolSize[] = ["1x1", "2x2", "3x2", "2x3", "3x3"];

const parseSizeDims = (size: string): [number, number] => {
  const parts = size.split("x").map(Number);
  return [parts[0] || 1, parts[1] || 1];
};

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
    if (!visible) return;
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, handleClickOutside, handleKeyDown]);

  if (!visible || !tool) return null;

  const isFolder = tool.type === "folder";
  const nextViewMode: ToolViewMode = tool.viewMode === "card" ? "icon" : "card";
  const canDock = !isFolder;
  const folders = isFolder ? [] : allTools.filter((item) => item.type === "folder" && item.id !== tool.id);

  const handleMoveToFolder = async (folderId: number) => {
    try {
      await fetchMoveToolToFolder(tool.id, folderId);
      onRefresh?.();
    } finally {
      onClose();
    }
  };

  const handleRemoveFromFolder = async () => {
    try {
      await fetchMoveToolToFolder(tool.id, null);
      onRefresh?.();
    } finally {
      onClose();
    }
  };

  const handleRename = async () => {
    const name = window.prompt("请输入新名称：", tool.name);
    if (!name?.trim()) return;
    try {
      await fetchUpdateTool({
        ...toUpdateDto(tool),
        id: tool.id,
        name: name.trim(),
      });
      onRefresh?.();
    } finally {
      onClose();
    }
  };

  const handleDeleteFolder = async (mode: "move-children-to-root" | "delete-with-children") => {
    try {
      await fetchDeleteFolder(tool.id, mode);
      onRefresh?.();
    } finally {
      onClose();
    }
  };

  const handleSetSize = (size: ToolSize) => {
    updateToolSize.mutate({ id: tool.id, size });
    onClose();
  };

  const renderSizeGrid = (cols: number, rows: number, isActive: boolean) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 2,
        width: cols * 10 + (cols - 1) * 2,
        height: rows * 10 + (rows - 1) * 2,
      }}
    >
      {Array.from({ length: cols * rows }).map((_, index) => (
        <div
          key={index}
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            backgroundColor: isActive
              ? "var(--widget-accent, rgba(99,102,241,0.7))"
              : "var(--widget-icon-bg, rgba(120,130,150,0.25))",
            transition: "background-color 0.15s",
          }}
        />
      ))}
    </div>
  );

  const handleCreateFolder = async () => {
    const name = window.prompt("请输入文件夹名称：");
    if (!name?.trim()) return;
    try {
      const folder = await fetchAddTool({
        name: name.trim(),
        url: "",
        logo: "",
        category: tool.category || "",
        description: "",
        sort: 1,
        hide: false,
        viewMode: "icon",
        type: "folder",
        parentId: null,
        size: "1x1",
        folderTint: "",
        gridX: -1,
        gridY: -1,
        folderViewMode: "grid",
        folderItemSize: 28,
      });
      if ("id" in folder && folder.id) {
        await fetchMoveToolToFolder(tool.id, folder.id);
      }
      onRefresh?.();
    } finally {
      onClose();
    }
  };

  return createPortal(
    <div className="tool-context-menu" style={{ left: x, top: y }} onClick={(event) => event.stopPropagation()}>
      <div className="tool-context-menu-title">{tool.name}</div>

      {isFolder ? (
        <>
          <button className="tool-context-menu-item" onClick={handleRename}>
            重命名
          </button>
          <div
            className="tool-context-menu-item-with-sub"
            onMouseEnter={() => setShowSizePicker(true)}
            onMouseLeave={() => setShowSizePicker(false)}
          >
            <button className="tool-context-menu-item tool-context-menu-item-flyout-trigger">
              大小 ({tool.size || "1x1"}) ▸
            </button>
            {showSizePicker && (
              <div className="tool-context-menu-submenu tool-context-menu-submenu-flyout size-picker-grid">
                {FOLDER_SIZES.map((size) => {
                  const [cols, rows] = parseSizeDims(size);
                  const isActive = tool.size === size;
                  return (
                    <button
                      key={size}
                      className={`size-picker-option ${isActive ? "active" : ""}`}
                      onClick={() => handleSetSize(size)}
                      title={`${cols}x${rows}`}
                    >
                      {renderSizeGrid(cols, rows, isActive)}
                      <span className="size-picker-label">{cols}x{rows}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            className="tool-context-menu-item tool-context-menu-danger"
            onClick={() => handleDeleteFolder("move-children-to-root")}
          >
            删除文件夹（保留内部工具）
          </button>
          <button
            className="tool-context-menu-item tool-context-menu-danger"
            onClick={() => handleDeleteFolder("delete-with-children")}
          >
            删除文件夹及内部工具
          </button>
        </>
      ) : (
        <>
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
          {canDock && !isInDock(tool.id) && (
            <button
              className="tool-context-menu-item"
              onClick={() => {
                onAddToDock(tool);
                onClose();
              }}
            >
              添加到 Dock
            </button>
          )}
          {tool.parentId != null && (
            <button className="tool-context-menu-item" onClick={handleRemoveFromFolder}>
              从文件夹移出
            </button>
          )}
          <button className="tool-context-menu-item" onClick={handleCreateFolder}>
            创建文件夹并移入
          </button>
          {folders.length > 0 && (
            <button
              className="tool-context-menu-item"
              onClick={() => setShowFolderPicker(!showFolderPicker)}
            >
              移动到文件夹 ▸
            </button>
          )}
          {showFolderPicker && (
            <div className="tool-context-menu-submenu">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  className="tool-context-menu-item"
                  onClick={() => handleMoveToFolder(folder.id)}
                >
                  {folder.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>,
    document.body
  );
};

export default ToolContextMenu;
