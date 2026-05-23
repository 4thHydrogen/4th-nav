import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import "./index.css";
import type { Tool, ToolViewMode, ToolSize } from "../../types";
import { fetchMoveToolToFolder, fetchDeleteFolder, fetchAddTool, fetchUpdateTool } from "../../utils/api";
import { useUpdateToolSize } from "../../queries";

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

  const handleClickOutside = useCallback(() => {
    setShowFolderPicker(false);
    setShowSizePicker(false);
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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

  // 文件夹不能移入其他文件夹（禁止嵌套）
  const folders = isFolder
    ? []
    : allTools.filter((t) => t.type === "folder" && t.id !== tool.id);

  const handleMoveToFolder = async (folderId: number) => {
    try {
      await fetchMoveToolToFolder(tool.id, folderId);
      onRefresh?.();
    } catch {
      // ignore
    }
    onClose();
  };

  const handleRemoveFromFolder = async () => {
    try {
      await fetchMoveToolToFolder(tool.id, null);
      onRefresh?.();
    } catch {
      // ignore
    }
    onClose();
  };

  const handleRename = async () => {
    const name = window.prompt("请输入新名称：", tool.name);
    if (!name?.trim()) return;
    try {
      await fetchUpdateTool({
        ...tool,
        id: tool.id,
        name: name.trim(),
      });
      onRefresh?.();
    } catch {
      // ignore
    }
    onClose();
  };

  const handleDeleteFolder = async (mode: "move-children-to-root" | "delete-with-children") => {
    try {
      await fetchDeleteFolder(tool.id, mode);
      onRefresh?.();
    } catch {
      // ignore
    }
    onClose();
  };

  const handleSetSize = (size: ToolSize) => {
    updateToolSize.mutate({ id: tool.id, size });
    onClose();
  };

  const FOLDER_SIZES: ToolSize[] = ["1x1", "2x2", "3x2", "2x3", "3x3"];

  const parseSizeDims = (s: string): [number, number] => {
    const parts = s.split("x").map(Number);
    return [parts[0] || 1, parts[1] || 1];
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
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div
          key={i}
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
        catelog: tool.catelog || "",
        desc: "",
        sort: 1,
        hide: false,
        viewMode: "icon",
        type: "folder",
        parentId: null,
        size: "1x1",
        bgColor: "",
        gridX: -1,
        gridY: -1,
        folderViewMode: "grid",
        folderItemSize: 28,
      });
      if (folder?.id) {
        await fetchMoveToolToFolder(tool.id, folder.id);
      }
      onRefresh?.();
    } catch {
      // ignore
    }
    onClose();
  };

  const menuStyle: React.CSSProperties = {
    left: x,
    top: y,
  };

  return createPortal(
    <div className="tool-context-menu" style={menuStyle} onClick={(e) => e.stopPropagation()}>
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
              大小 ({tool.size || "1×1"}) ▸
            </button>
            {showSizePicker && (
              <div className="tool-context-menu-submenu tool-context-menu-submenu-flyout size-picker-grid">
                {FOLDER_SIZES.map((s) => {
                  const [cols, rows] = parseSizeDims(s);
                  const isActive = tool.size === s;
                  return (
                    <button
                      key={s}
                      className={`size-picker-option ${isActive ? "active" : ""}`}
                      onClick={() => handleSetSize(s)}
                      title={`${cols}×${rows}`}
                    >
                      {renderSizeGrid(cols, rows, isActive)}
                      <span className="size-picker-label">{cols}×{rows}</span>
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
            <button
              className="tool-context-menu-item"
              onClick={handleRemoveFromFolder}
            >
              从文件夹移出
            </button>
          )}
          <button
            className="tool-context-menu-item"
            onClick={handleCreateFolder}
          >
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
              {folders.map((f) => (
                <button
                  key={f.id}
                  className="tool-context-menu-item"
                  onClick={() => handleMoveToFolder(f.id)}
                >
                  {f.name}
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
