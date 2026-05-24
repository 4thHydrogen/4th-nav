import type { Tool, ToolSize, ToolViewMode } from "../../types";
import { FOLDER_SIZES, parseSizeDims } from "./model";

interface ToolContextMenuViewProps {
  tool: Tool;
  nextViewMode: ToolViewMode;
  canDock: boolean;
  isDocked: boolean;
  folders: Tool[];
  showFolderPicker: boolean;
  showSizePicker: boolean;
  onToggleFolderPicker: (next: boolean) => void;
  onToggleSizePicker: (next: boolean) => void;
  onToggleViewMode: (nextMode: ToolViewMode) => void;
  onOpenInNewTab: () => void;
  onCopyUrl: () => void;
  onAddToDock: () => void;
  onRemoveFromFolder: () => void;
  onCreateFolder: () => void;
  onMoveToFolder: (folderId: number) => void;
  onRename: () => void;
  onDeleteFolder: (mode: "move-children-to-root" | "delete-with-children") => void;
  onSetSize: (size: ToolSize) => void;
}

function renderSizeGrid(cols: number, rows: number, isActive: boolean) {
  return (
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
}

export function ToolContextMenuView({
  tool,
  nextViewMode,
  canDock,
  isDocked,
  folders,
  showFolderPicker,
  showSizePicker,
  onToggleFolderPicker,
  onToggleSizePicker,
  onToggleViewMode,
  onOpenInNewTab,
  onCopyUrl,
  onAddToDock,
  onRemoveFromFolder,
  onCreateFolder,
  onMoveToFolder,
  onRename,
  onDeleteFolder,
  onSetSize,
}: ToolContextMenuViewProps) {
  const isFolder = tool.type === "folder";

  return (
    <>
      <div className="tool-context-menu-title">{tool.name}</div>

      {isFolder ? (
        <>
          <button className="tool-context-menu-item" onClick={onRename}>
            重命名
          </button>
          <div
            className="tool-context-menu-item-with-sub"
            onMouseEnter={() => onToggleSizePicker(true)}
            onMouseLeave={() => onToggleSizePicker(false)}
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
                      onClick={() => onSetSize(size)}
                      title={`${cols}x${rows}`}
                    >
                      {renderSizeGrid(cols, rows, isActive)}
                      <span className="size-picker-label">
                        {cols}x{rows}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            className="tool-context-menu-item tool-context-menu-danger"
            onClick={() => onDeleteFolder("move-children-to-root")}
          >
            删除文件夹（保留内部工具）
          </button>
          <button
            className="tool-context-menu-item tool-context-menu-danger"
            onClick={() => onDeleteFolder("delete-with-children")}
          >
            删除文件夹及内部工具
          </button>
        </>
      ) : (
        <>
          <button
            className="tool-context-menu-item"
            onClick={() => onToggleViewMode(nextViewMode)}
          >
            {nextViewMode === "icon" ? "切换为图标模式" : "切换为卡片模式"}
          </button>
          <button className="tool-context-menu-item" onClick={onOpenInNewTab}>
            新标签页打开
          </button>
          <button className="tool-context-menu-item" onClick={onCopyUrl}>
            复制链接
          </button>
          {canDock && !isDocked && (
            <button className="tool-context-menu-item" onClick={onAddToDock}>
              添加到 Dock
            </button>
          )}
          {tool.parentId != null && (
            <button className="tool-context-menu-item" onClick={onRemoveFromFolder}>
              从文件夹移出
            </button>
          )}
          <button className="tool-context-menu-item" onClick={onCreateFolder}>
            创建文件夹并移入
          </button>
          {folders.length > 0 && (
            <button
              className="tool-context-menu-item"
              onClick={() => onToggleFolderPicker(!showFolderPicker)}
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
                  onClick={() => onMoveToFolder(folder.id)}
                >
                  {folder.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
