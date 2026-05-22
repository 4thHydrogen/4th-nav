import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { LayoutGrid, List, X } from "lucide-react";
import type { Tool, FolderViewMode, SiteConfig } from "../../types";
import { useUpdateFolderSettings } from "../../queries";
import WidgetTool from "../WidgetTool";
import ListToolItem from "../ListToolItem";
import "./index.css";

interface FolderPopupPanelProps {
  folder: Tool;
  children: Tool[];
  mouseX: number;
  mouseY: number;
  listItemSize: number;
  siteConfig: SiteConfig;
  onClose: () => void;
  onOpenTool: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onMoveOut: (toolId: number) => void;
  noImageMode: boolean;
}

const FolderPopupPanel = ({
  folder,
  children,
  mouseX,
  mouseY,
  listItemSize,
  siteConfig,
  onClose,
  onOpenTool,
  onContextMenu,
  onMoveOut,
  noImageMode,
}: FolderPopupPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const updateFolderSettings = useUpdateFolderSettings();
  const viewMode: FolderViewMode = folder.folderViewMode || "grid";

  const [panelSize, setPanelSize] = useState<{ width: number; height: number } | null>(null);

  // Drag-out state
  const [draggingToolId, setDraggingToolId] = useState<number | null>(null);
  const [dragOutZone, setDragOutZone] = useState(false);
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const dragStateRef = useRef<{
    toolId: number;
    startX: number;
    startY: number;
    active: boolean;
  } | null>(null);

  useEffect(() => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setPanelSize({ width: rect.width, height: rect.height });
    }
  }, [children, viewMode, listItemSize]);

  const position = useMemo(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxHeight = vh * 0.7;

    const w = panelSize?.width ?? 280;
    const h = Math.min(panelSize?.height ?? 300, maxHeight);

    let left = mouseX + 4;
    let top = mouseY + 4;

    if (left + w > vw - 8) left = mouseX - w - 4;
    if (top + h > vh - 8) top = mouseY - h - 4;
    if (left < 8) left = 8;
    if (top < 8) top = 8;

    return { left, top, maxHeight };
  }, [mouseX, mouseY, panelSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Outside click — suppressed during drag
  useEffect(() => {
    let active = false;
    requestAnimationFrame(() => { active = true; });
    const handleClickOutside = (e: MouseEvent) => {
      if (!active) return;
      if (isDraggingRef.current) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleViewModeToggle = useCallback(() => {
    const newMode: FolderViewMode = viewMode === "grid" ? "list" : "grid";
    updateFolderSettings.mutate({ id: folder.id, folderViewMode: newMode });
  }, [folder.id, viewMode, updateFolderSettings]);

  const handleToolClick = useCallback(
    (tool: Tool) => {
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      if (tool.url) {
        window.open(tool.url, "_blank", "noopener,noreferrer");
      }
      onOpenTool(tool);
    },
    [onOpenTool]
  );

  // Drag-out: pointer-down starts tracking; pointer-move activates after threshold;
  // pointer-up outside panel triggers moveOut.
  const handleItemPointerDown = useCallback(
    (toolId: number, e: React.PointerEvent) => {
      if (e.button !== 0) return;
      dragStateRef.current = {
        toolId,
        startX: e.clientX,
        startY: e.clientY,
        active: false,
      };

      const handleMove = (ev: PointerEvent) => {
        const ds = dragStateRef.current;
        if (!ds) return;
        if (!ds.active) {
          const dx = ev.clientX - ds.startX;
          const dy = ev.clientY - ds.startY;
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            ds.active = true;
            setDraggingToolId(ds.toolId);
            isDraggingRef.current = true;
            didDragRef.current = true;
          }
        }
        if (ds.active && panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect();
          const outside =
            ev.clientX < rect.left || ev.clientX > rect.right ||
            ev.clientY < rect.top || ev.clientY > rect.bottom;
          setDragOutZone(outside);
        }
      };

      const handleUp = (ev: PointerEvent) => {
        const ds = dragStateRef.current;
        if (ds?.active && panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect();
          const outside =
            ev.clientX < rect.left || ev.clientX > rect.right ||
            ev.clientY < rect.top || ev.clientY > rect.bottom;
          if (outside) {
            onMoveOut(ds.toolId);
          }
        }
        dragStateRef.current = null;
        setDraggingToolId(null);
        setDragOutZone(false);
        isDraggingRef.current = false;
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [onMoveOut]
  );

  const content =
    viewMode === "list" ? (
      <div className="folder-popup-list" style={{ maxHeight: position.maxHeight - 44 }}>
        {children.map((item) => (
          <div
            key={item.id}
            className={`folder-popup-draggable${draggingToolId === item.id ? " dragging" : ""}`}
            onPointerDown={(e) => handleItemPointerDown(item.id, e)}
          >
            <ListToolItem
              tool={item}
              itemSize={listItemSize}
              onOpen={handleToolClick}
              onContextMenu={onContextMenu}
            />
          </div>
        ))}
      </div>
    ) : (
      <div className="folder-popup-grid" style={{ maxHeight: position.maxHeight - 44 }}>
        {children.map((item) => (
          <div
            key={item.id}
            className={`folder-popup-draggable${draggingToolId === item.id ? " dragging" : ""}`}
            onPointerDown={(e) => handleItemPointerDown(item.id, e)}
          >
            <WidgetTool
              tool={item}
              onContextMenu={(e) => onContextMenu(e, item)}
              onClick={() => handleToolClick(item)}
            />
          </div>
        ))}
      </div>
    );

  return createPortal(
    <div
      ref={panelRef}
      className="folder-popup-panel"
      style={{
        left: position.left,
        top: position.top,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="folder-popup-header">
        <span className="folder-popup-title">{folder.name}</span>
        <div className="folder-popup-actions">
          <button
            className="folder-popup-action-btn"
            onClick={handleViewModeToggle}
            title={viewMode === "grid" ? "切换到列表模式" : "切换到图标模式"}
          >
            {viewMode === "grid" ? <List size={14} /> : <LayoutGrid size={14} />}
          </button>
          <button className="folder-popup-action-btn" onClick={onClose} title="关闭">
            <X size={14} />
          </button>
        </div>
      </div>
      {content}
      {draggingToolId != null && (
        <div className="folder-popup-drag-hint">
          {dragOutZone ? "松开鼠标移出文件夹" : "拖到面板外以移出文件夹"}
        </div>
      )}
    </div>,
    document.body
  );
};

export default FolderPopupPanel;
