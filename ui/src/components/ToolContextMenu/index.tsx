import { useEffect, useCallback, useState } from "react";
import "./index.css";
import type { Tool, ToolViewMode, ToolSize } from "../../types";
import { fetchMoveToolToFolder, fetchDeleteFolder, fetchAddTool, fetchUpdateTool } from "../../utils/api";

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

  const folders = allTools.filter((t) => t.type === "folder" && t.id !== tool.id);

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
        id: tool.id,
        name: name.trim(),
        url: tool.url,
        logo: tool.logo,
        catelog: tool.catelog,
        desc: tool.desc,
        sort: tool.sort,
        hide: tool.hide,
        viewMode: tool.viewMode,
        type: tool.type,
        parentId: tool.parentId,
        size: tool.size,
        bgColor: tool.bgColor,
        gridX: tool.gridX,
        gridY: tool.gridY,
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

  const handleSetSize = async (size: ToolSize) => {
    try {
      await fetchUpdateTool({
        id: tool.id,
        name: tool.name,
        url: tool.url,
        logo: tool.logo,
        catelog: tool.catelog,
        desc: tool.desc,
        sort: tool.sort,
        hide: tool.hide,
        viewMode: tool.viewMode,
        type: tool.type,
        parentId: tool.parentId,
        size,
        bgColor: tool.bgColor,
        gridX: tool.gridX,
        gridY: tool.gridY,
      });
      onRefresh?.();
    } catch {
      // ignore
    }
    onClose();
  };

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

  return (
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
              大小 ({tool.size || "1x1"}) ▸
            </button>
            {showSizePicker && (
              <div className="tool-context-menu-submenu tool-context-menu-submenu-flyout">
                {(["1x1", "1x2", "2x1", "2x2"] as ToolSize[]).map((s) => (
                  <button
                    key={s}
                    className={`tool-context-menu-item ${tool.size === s ? "active" : ""}`}
                    onClick={() => handleSetSize(s)}
                  >
                    {s.replace("x", "×")}
                  </button>
                ))}
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
    </div>
  );
};

export default ToolContextMenu;
