import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { X, List, LayoutGrid, Folder } from "lucide-react";
import "./index.css";
import WidgetTool from "../WidgetTool";
import { useUpdateFolderSettings } from "../../queries";
import type { Tool, FolderViewMode } from "../../types";
import { getJumpTarget } from "../../utils/setting";

interface FolderFloatingWindowProps {
  folder: Tool;
  children: Tool[];
  listItemSize: number;
  folderCardRect: DOMRect | null;
  gridRect: DOMRect | null;
  onClose: () => void;
  onOpenTool: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onMoveOut: (toolId: number) => void;
}

export default function FolderFloatingWindow({
  folder,
  children,
  listItemSize,
  folderCardRect,
  gridRect,
  onClose,
  onOpenTool,
  onContextMenu,
  onMoveOut,
}: FolderFloatingWindowProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const updateFolderSettings = useUpdateFolderSettings();
  const viewMode: FolderViewMode = folder.folderViewMode || "grid";

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

  const [w, h] = useMemo(() => {
    const parts = (folder.size || "2x2").split("x").map(Number);
    return [parts[0] || 2, parts[1] || 2];
  }, [folder.size]);

  // Position: centered on folder card, large modal
  const position = useMemo(() => {
    if (!folderCardRect || !gridRect) return { left: 0, top: 0 };

    const panelWidth = Math.min(gridRect.width * 0.85, 800);
    const panelHeight = Math.min(window.innerHeight * 0.75, 600);

    // Center horizontally on folder card
    let left = (folderCardRect.left - gridRect.left) + (folderCardRect.width / 2) - (panelWidth / 2);
    // Clamp to grid bounds
    if (left < 16) left = 16;
    if (left + panelWidth > gridRect.width - 16) left = gridRect.width - panelWidth - 16;

    // Vertically: start near folder card, clamp to viewport
    let top = (folderCardRect.top - gridRect.top) - 20;
    if (top < 16) top = 16;
    if (top + panelHeight > window.innerHeight * 0.85) top = window.innerHeight * 0.85 - panelHeight;

    return { left, top };
  }, [folderCardRect, gridRect]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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
        window.open(tool.url, getJumpTarget() === "blank" ? "_blank" : "_self", "noopener,noreferrer");
      }
      onOpenTool(tool);
    },
    [onOpenTool]
  );

  // Drag-out via Pointer Events (Phase 4 will add dnd-kit integration)
  const handleItemPointerDown = useCallback(
    (toolId: number, e: React.PointerEvent) => {
      if (e.button !== 0) return;
      dragStateRef.current = { toolId, startX: e.clientX, startY: e.clientY, active: false };

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
      <div
        className="folder-floating-list"
        style={{ "--folder-list-item-size": `${listItemSize}px` } as React.CSSProperties}
      >
        {children.map((item) => (
          <div
            key={item.id}
            className={`folder-floating-item${draggingToolId === item.id ? " dragging" : ""}`}
            onPointerDown={(e) => handleItemPointerDown(item.id, e)}
          >
            <WidgetTool
              tool={item}
              compact
              layout="list"
              onContextMenu={(e) => onContextMenu(e, item)}
              onClick={() => handleToolClick(item)}
            />
          </div>
        ))}
      </div>
    ) : (
      <div className="folder-floating-grid">
        {children.map((item) => (
          <div
            key={item.id}
            className={`folder-floating-item${draggingToolId === item.id ? " dragging" : ""}`}
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

  return (
    <>
      {/* Overlay blocks main panel */}
      <div className="folder-floating-overlay" onMouseDown={onClose} />

      {/* Floating window */}
      <div
        ref={panelRef}
        className="folder-floating-window"
        style={{
          left: position.left,
          top: position.top,
          width: `min(${gridRect ? gridRect.width * 0.85 : 600}px, 800px)`,
          maxHeight: "75vh",
        }}
      >
        <div className="folder-floating-header" onContextMenu={(e) => onContextMenu(e, folder)}>
          <span className="folder-floating-title">
            <Folder size={14} />
            {folder.name}
          </span>
          <div className="folder-floating-actions">
            <button
              className="folder-floating-action-btn"
              onClick={handleViewModeToggle}
              title={viewMode === "grid" ? "切换到列表模式" : "切换到图标模式"}
            >
              {viewMode === "grid" ? <List size={14} /> : <LayoutGrid size={14} />}
            </button>
            <button className="folder-floating-action-btn" onClick={onClose} title="关闭">
              <X size={14} />
            </button>
          </div>
        </div>

        {content}

        {draggingToolId != null && (
          <div className="folder-floating-drag-hint">
            {dragOutZone ? "松开鼠标移出文件夹" : "拖到窗口外以移出文件夹"}
          </div>
        )}
      </div>
    </>
  );
}
