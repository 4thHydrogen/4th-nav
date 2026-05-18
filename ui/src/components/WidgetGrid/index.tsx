import { useCallback, useEffect, useMemo, useRef } from "react";
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
  ROW_HEIGHT,
  MARGIN,
  type GridLayout,
} from "./useGridLayout";
import { useGridDrag } from "./useGridDrag";
import WidgetTool from "../WidgetTool";
import WidgetFolder from "../WidgetFolder";
import InlineFolderPanel from "../InlineFolderPanel";
import { useUIStore } from "../../stores/ui";

interface WidgetGridProps {
  tools: Tool[];
  allTools: Tool[];
  noImageMode: boolean;
  onToolClick: (tool: Tool) => void;
  onToolContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onMoveToFolder: (toolId: number, folderId: number) => void;
  onMergeToFolder: (toolId1: number, toolId2: number) => void;
}

interface DraggableItemProps {
  tool: Tool;
  style: { left: number; top: number; width: number; height: number } | undefined;
  isDropTarget: boolean;
  isDragging: boolean;
  children: React.ReactNode;
}

const DraggableItem = ({ tool, style, isDropTarget, isDragging, children }: DraggableItemProps) => {
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
      layout
      ref={setRefs}
      data-grid-id={tool.id}
      className={`widget-grid-item${isDragging ? " widget-grid-item-dragging" : ""}${isDropTarget ? " widget-drop-target" : ""}`}
      style={{
        position: "absolute",
        left: style?.left ?? 0,
        top: style?.top ?? 0,
        width: style?.width ?? 0,
        height: style?.height ?? 0,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      {...attributes}
      {...listeners}
    >
      {children}
    </motion.div>
  );
};

const INLINE_PANEL_ROWS = 3;

const WidgetGrid = ({
  tools,
  allTools,
  noImageMode,
  onToolClick,
  onToolContextMenu,
  onMoveToFolder,
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
  } = useGridLayout(tools);

  const { expandedFolderId, setExpandedFolderId } = useUIStore();

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
    expandedFolderId,
    setExpandedFolderId,
    onMoveToFolder,
    onMergeToFolder,
  });

  const handleFolderOpen = useCallback(
    (tool: Tool) => {
      setExpandedFolderId(expandedFolderId === tool.id ? null : tool.id);
    },
    [expandedFolderId, setExpandedFolderId]
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const mouseEnteredPanel = useRef(false);

  useEffect(() => {
    if (expandedFolderId == null) {
      mouseEnteredPanel.current = false;
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const folderEl = document.querySelector(`[data-grid-id="${expandedFolderId}"]`);
      const isInFolder = folderEl?.contains(target);
      const isInPanel = panelRef.current?.contains(target);
      if (!isInFolder && !isInPanel) {
        setExpandedFolderId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expandedFolderId, setExpandedFolderId]);

  const itemStyles = useMemo(() => {
    const styles = new Map<string, { left: number; top: number; width: number; height: number }>();
    for (const l of layout) {
      styles.set(l.i, gridToPixels(l, width, cols, ROW_HEIGHT, MARGIN as [number, number]));
    }
    return styles;
  }, [layout, width, cols]);

  const inlinePanelStyle = useMemo(() => {
    if (expandedFolderId == null || width === 0) return null;
    const folderLayout = layout.find((l) => l.i === String(expandedFolderId));
    if (!folderLayout) return null;
    const panelTop = (folderLayout.y + folderLayout.h) * (ROW_HEIGHT + MARGIN[1]);
    return {
      left: 0,
      top: panelTop,
      width,
      height: INLINE_PANEL_ROWS * ROW_HEIGHT + (INLINE_PANEL_ROWS - 1) * MARGIN[1],
    };
  }, [expandedFolderId, layout, width, cols]);

  const expandedFolder = expandedFolderId != null ? toolsMap.get(String(expandedFolderId)) : null;
  const expandedChildren = expandedFolderId != null ? (childrenMap[expandedFolderId] ?? []) : [];

  const effectiveHeight = useMemo(() => {
    if (!inlinePanelStyle) return totalHeight;
    return Math.max(totalHeight, inlinePanelStyle.top + inlinePanelStyle.height + MARGIN[1]);
  }, [totalHeight, inlinePanelStyle]);

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
              height: effectiveHeight,
              "--cell-width": `${cellWidth}px`,
              "--row-height": `${ROW_HEIGHT}px`,
              "--cell-gap-x": `${MARGIN[0]}px`,
              "--cell-gap-y": `${MARGIN[1]}px`,
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
                >
                  {isFolder ? (
                    <WidgetFolder
                      folder={tool}
                      childrenTools={children}
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
              {inlinePanelStyle && expandedFolder && (
                <motion.div
                  ref={panelRef}
                  key={`panel-${expandedFolderId}`}
                  className="widget-grid-inline-panel"
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    left: inlinePanelStyle.left,
                    top: inlinePanelStyle.top,
                    width: inlinePanelStyle.width,
                    height: inlinePanelStyle.height,
                    zIndex: 50,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => { mouseEnteredPanel.current = true; }}
                  onMouseLeave={() => {
                    if (mouseEnteredPanel.current) setExpandedFolderId(null);
                  }}
                >
                  <InlineFolderPanel
                    folder={expandedFolder}
                    items={expandedChildren}
                    noImageMode={noImageMode}
                    onOpenTool={onToolClick}
                    onClose={() => setExpandedFolderId(null)}
                  />
                </motion.div>
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
