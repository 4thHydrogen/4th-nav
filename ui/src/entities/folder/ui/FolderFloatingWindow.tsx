import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Folder, LayoutGrid, List, X } from "lucide-react";
import { motion } from "framer-motion";
import type { FolderViewMode, Tool } from "../../../types";
import { useUpdateFolderSettings } from "../../../queries";
import { getJumpTarget } from "../../../utils/setting";
import { FloatingPortal } from "../../../shared/ui/overlay/FloatingPortal";
import { useOutsidePointerDown } from "../../../shared/ui/overlay/useOutsidePointerDown";
import { FolderFloatingContent } from "./FolderFloatingContent";
import {
  getFloatingWindowPosition,
  getFolderDragHint,
  getFolderViewToggleTitle,
} from "./folderFloatingWindowUtils";
import "./folder-floating-window.css";

interface FolderFloatingWindowProps {
  folder: Tool;
  children: Tool[];
  listItemSize: number;
  folderCardRect: DOMRect | null;
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
  onClose,
  onOpenTool,
  onContextMenu,
  onMoveOut,
}: FolderFloatingWindowProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const updateFolderSettings = useUpdateFolderSettings();
  const viewMode: FolderViewMode = folder.folderViewMode || "grid";
  const [draggingToolId, setDraggingToolId] = useState<number | null>(null);
  const [dragOutZone, setDragOutZone] = useState(false);
  const didDragRef = useRef(false);
  const dragStateRef = useRef<{
    toolId: number;
    startX: number;
    startY: number;
    active: boolean;
  } | null>(null);

  useOutsidePointerDown(panelRef, onClose);

  const position = useMemo(
    () => getFloatingWindowPosition(folderCardRect),
    [folderCardRect]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleViewModeToggle = useCallback(() => {
    const nextMode: FolderViewMode = viewMode === "grid" ? "list" : "grid";
    updateFolderSettings.mutate({ id: folder.id, folderViewMode: nextMode });
  }, [folder.id, updateFolderSettings, viewMode]);

  const handleToolClick = useCallback(
    (tool: Tool) => {
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }

      if (tool.url) {
        window.open(
          tool.url,
          getJumpTarget() === "blank" ? "_blank" : "_self",
          "noopener,noreferrer"
        );
      }
      onOpenTool(tool);
    },
    [onOpenTool]
  );

  const handleItemPointerDown = useCallback(
    (toolId: number, event: React.PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      dragStateRef.current = {
        toolId,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
      };

      const handleMove = (moveEvent: PointerEvent) => {
        const dragState = dragStateRef.current;
        if (!dragState) {
          return;
        }

        if (!dragState.active) {
          const dx = moveEvent.clientX - dragState.startX;
          const dy = moveEvent.clientY - dragState.startY;
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            dragState.active = true;
            setDraggingToolId(dragState.toolId);
            didDragRef.current = true;
          }
        }

        if (dragState.active && panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect();
          const outside =
            moveEvent.clientX < rect.left ||
            moveEvent.clientX > rect.right ||
            moveEvent.clientY < rect.top ||
            moveEvent.clientY > rect.bottom;
          setDragOutZone(outside);
        }
      };

      const handleUp = (upEvent: PointerEvent) => {
        const dragState = dragStateRef.current;
        if (dragState?.active && panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect();
          const outside =
            upEvent.clientX < rect.left ||
            upEvent.clientX > rect.right ||
            upEvent.clientY < rect.top ||
            upEvent.clientY > rect.bottom;
          if (outside) {
            onMoveOut(dragState.toolId);
          }
        }

        dragStateRef.current = null;
        setDraggingToolId(null);
        setDragOutZone(false);
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [onMoveOut]
  );

  return (
    <FloatingPortal>
      <motion.div
        className="folder-floating-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, pointerEvents: "none" as const }}
        transition={{ duration: 0.18 }}
        onMouseDown={onClose}
      />

      <motion.div
        ref={panelRef}
        className="folder-floating-window"
        initial={{ opacity: 0, scale: 0.92, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: -6, pointerEvents: "none" as const }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 28,
          mass: 0.8,
        }}
        style={{
          left: position.left,
          top: position.top,
          width: position.width,
          maxHeight: "72vh",
        }}
      >
        <div
          className="folder-floating-header"
          onContextMenu={(event) => onContextMenu(event, folder)}
        >
          <span className="folder-floating-title">
            <Folder size={14} />
            {folder.name}
          </span>
          <div className="folder-floating-actions">
            <button
              className="folder-floating-action-btn"
              onClick={handleViewModeToggle}
              title={getFolderViewToggleTitle(viewMode)}
            >
              {viewMode === "grid" ? <List size={14} /> : <LayoutGrid size={14} />}
            </button>
            <button
              className="folder-floating-action-btn"
              onClick={onClose}
              title="关闭"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <FolderFloatingContent
          viewMode={viewMode}
          children={children}
          draggingToolId={draggingToolId}
          listItemSize={listItemSize}
          onPointerDown={handleItemPointerDown}
          onContextMenu={onContextMenu}
          onToolClick={handleToolClick}
        />

        {draggingToolId != null && (
          <div className="folder-floating-drag-hint">
            {getFolderDragHint(dragOutZone)}
          </div>
        )}
      </motion.div>
    </FloatingPortal>
  );
}
