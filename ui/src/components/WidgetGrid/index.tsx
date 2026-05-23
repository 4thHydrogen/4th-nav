import { useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import "./index.css";
import type { Tool } from "../../types";
import {
  useGridLayout,
  gridToPixels,
  type GridLayout,
} from "./useGridLayout";
import { useGridDrag } from "./useGridDrag";
import WidgetTool from "../WidgetTool";
import WidgetFolder from "../WidgetFolder";
import FolderFloatingWindow from "../FolderFloatingWindow";
import { useFloatingPanel } from "../OverlayLayer/useFloatingPanel";

interface WidgetGridProps {
  tools: Tool[];
  allTools: Tool[];
  noImageMode: boolean;
  listItemSize: number;
  onToolClick: (tool: Tool) => void;
  onToolContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onMoveToFolder: (toolId: number, folderId: number) => void;
  onMoveOutOfFolder: (toolId: number) => void;
  onMergeToFolder: (toolId1: number, toolId2: number, pos1: { x: number; y: number }, pos2: { x: number; y: number }) => void;
}

interface DraggableItemProps {
  tool: Tool;
  style: { left: number; top: number; width: number; height: number } | undefined;
  isDropTarget: boolean;
  isDragging: boolean;
  children: React.ReactNode;
  dataToolId?: string;
}

const DraggableItem = ({ tool, style, isDropTarget, isDragging, children, dataToolId }: DraggableItemProps) => {
  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({ id: String(tool.id) });
  const { setNodeRef: setDropRef } = useDroppable({ id: String(tool.id) });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );

  return (
    <motion.div
      ref={setRefs}
      data-grid-id={tool.id}
      data-tool-id={dataToolId}
      className={`widget-grid-item${isDragging ? " widget-grid-item-dragging" : ""}${isDropTarget ? " widget-drop-target" : ""}`}
      style={{ position: "absolute" }}
      animate={{
        left: style?.left ?? 0,
        top: style?.top ?? 0,
        width: style?.width ?? 0,
        height: style?.height ?? 0,
      }}
      initial={false}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 32,
        mass: 0.8,
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </motion.div>
  );
};

const WidgetGrid = ({
  tools,
  allTools,
  noImageMode,
  listItemSize,
  onToolClick,
  onToolContextMenu,
  onMoveToFolder,
  onMoveOutOfFolder,
  onMergeToFolder,
}: WidgetGridProps) => {
  const {
    layout,
    setLayout,
    updateLayout,
    wrapperRef,
    gridRef,
    width,
    cols,
    totalHeight,
    cellWidth,
    rowHeight,
    margin,
    isClampMode,
  } = useGridLayout(tools);

  // Unified folder overlay state (single source of truth)
  const folderPanel = useFloatingPanel<number>();

  const toolsMap = useMemo(() => {
    const m = new Map<string, Tool>();
    tools.forEach((t) => m.set(String(t.id), t));
    return m;
  }, [tools]);

  const folderIds = useMemo(
    () => new Set(tools.filter((t) => t.type === "folder").map((t) => String(t.id))),
    [tools]
  );

  const childrenMap = useMemo(() => {
    const map: Record<number, Tool[]> = {};
    allTools.forEach((tool) => {
      if (tool.parentId != null) {
        if (!map[tool.parentId]) map[tool.parentId] = [];
        map[tool.parentId].push(tool);
      }
    });
    return map;
  }, [allTools]);

  const layoutMap = useMemo(() => {
    const m = new Map<string, GridLayout>();
    layout.forEach((l) => m.set(l.i, l));
    return m;
  }, [layout]);

  const {
    sensors,
    activeId,
    altHeld,
    dropTargetId,
    activeTool,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  } = useGridDrag({
    gridRef,
    layout,
    setLayout,
    updateLayout,
    layoutMap,
    toolsMap,
    folderIds,
    width,
    cols,
    expandedFolderId: folderPanel.state.payload ?? null,
    setExpandedFolderId: (id: number | null) => {
      if (id == null) folderPanel.close();
    },
    onMoveToFolder,
    onMergeToFolder,
    rowHeight,
    margin: margin as [number, number],
  });

  const handleFolderOpen = useCallback(
    (tool: Tool) => {
      const folderEl = gridRef.current?.querySelector(`[data-tool-id="${tool.id}"]`);
      if (!folderEl) return;
      const rect = folderEl.getBoundingClientRect();
      folderPanel.toggle(rect, tool.id);
    },
    [gridRef, folderPanel.toggle],
  );

  const itemStyles = useMemo(() => {
    const styles = new Map<string, { left: number; top: number; width: number; height: number }>();
    for (const l of layout) {
      styles.set(l.i, gridToPixels(l, width, cols, rowHeight, margin));
    }
    return styles;
  }, [layout, width, cols, rowHeight, margin]);

  const expandedFolderId = folderPanel.state.payload ?? null;
  const expandedFolder = expandedFolderId != null ? toolsMap.get(String(expandedFolderId)) : null;
  const expandedChildren = expandedFolderId != null ? (childrenMap[expandedFolderId] ?? []) : [];
  const folderAnchorRect = folderPanel.state.phase !== "closed" ? folderPanel.state.anchorRect as DOMRect : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      autoScroll={{ threshold: { x: 0, y: 0.15 }, acceleration: 10, interval: 16 }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="widget-grid-wrapper" ref={wrapperRef}>
        {altHeld && (
          <div className="widget-grid-alt-hint">
            Alt 已按下 — 拖动工具到文件夹或其他工具上方
          </div>
        )}
        {width > 0 && (
          <div
            ref={gridRef}
            className="widget-grid-container"
            style={{
              position: "relative" as const,
              height: totalHeight,
              "--cell-width": `${cellWidth}px`,
              "--row-height": `${rowHeight}px`,
              "--cell-gap-x": `${margin[0]}px`,
              "--cell-gap-y": `${margin[1]}px`,
            } as React.CSSProperties}
          >
            {tools.map((tool) => {
              const key = String(tool.id);
              const isFolder = tool.type === "folder";
              const children = isFolder ? (childrenMap[tool.id] || []) : [];

              return (
                <DraggableItem
                  key={key}
                  tool={tool}
                  style={itemStyles.get(key)}
                  isDropTarget={dropTargetId === key}
                  isDragging={activeId === key}
                  dataToolId={key}
                >
                  {isFolder ? (
                    <WidgetFolder
                      folder={tool}
                      childrenTools={children}
                      listItemSize={listItemSize}
                      onOpen={() => handleFolderOpen(tool)}
                      onOpenChild={onToolClick}
                      onContextMenu={onToolContextMenu}
                    />
                  ) : (
                    <WidgetTool
                      tool={tool}
                      onContextMenu={onToolContextMenu}
                      onClick={() => onToolClick(tool)}
                    />
                  )}
                </DraggableItem>
              );
            })}

            <AnimatePresence>
              {folderPanel.isOpen && expandedFolder && (
                <FolderFloatingWindow
                  key={expandedFolder.id}
                  folder={expandedFolder}
                  children={expandedChildren}
                  listItemSize={listItemSize}
                  folderCardRect={folderAnchorRect}
                  onClose={() => folderPanel.markClosed()}
                  onOpenTool={onToolClick}
                  onContextMenu={onToolContextMenu}
                  onMoveOut={onMoveOutOfFolder}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId && activeTool ? (
          <div
            className="widget-grid-drag-overlay"
            style={{
              width: itemStyles.get(activeId)?.width,
              height: itemStyles.get(activeId)?.height,
            }}
          >
            <WidgetTool
              tool={activeTool}
              onContextMenu={() => {}}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default WidgetGrid;
