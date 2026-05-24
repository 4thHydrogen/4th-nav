import { useCallback, useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { Tool } from "../../types";
import { useFloatingPanel } from "../../shared/ui/overlay/useFloatingPanel";
import { gridToPixels, type GridLayout, useGridLayout } from "./useGridLayout";
import { useGridDrag } from "./useGridDrag";
import { PanelGridCanvas, type PanelGridItemStyle } from "./PanelGridCanvas";
import { ToolDragOverlay } from "./ToolDragOverlay";
import "./panel-grid.css";

interface PanelGridProps {
  tools: Tool[];
  allTools: Tool[];
  noImageMode: boolean;
  listItemSize: number;
  onToolClick: (tool: Tool) => void;
  onToolContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onMoveToFolder: (toolId: number, folderId: number) => void;
  onMoveOutOfFolder: (toolId: number) => void;
  onMergeToFolder: (
    toolId1: number,
    toolId2: number,
    pos1: { x: number; y: number },
    pos2: { x: number; y: number }
  ) => void;
}

export default function PanelGrid({
  tools,
  allTools,
  noImageMode,
  listItemSize,
  onToolClick,
  onToolContextMenu,
  onMoveToFolder,
  onMoveOutOfFolder,
  onMergeToFolder,
}: PanelGridProps) {
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
  } = useGridLayout(tools);

  const folderPanel = useFloatingPanel<number>();

  const toolsMap = useMemo(() => {
    const map = new Map<string, Tool>();
    tools.forEach((tool) => map.set(String(tool.id), tool));
    return map;
  }, [tools]);

  const folderIds = useMemo(
    () => new Set(tools.filter((tool) => tool.type === "folder").map((tool) => String(tool.id))),
    [tools]
  );

  const childrenMap = useMemo(() => {
    const map: Record<number, Tool[]> = {};
    allTools.forEach((tool) => {
      if (tool.parentId != null) {
        if (!map[tool.parentId]) {
          map[tool.parentId] = [];
        }
        map[tool.parentId].push(tool);
      }
    });
    return map;
  }, [allTools]);

  const layoutMap = useMemo(() => {
    const map = new Map<string, GridLayout>();
    layout.forEach((item) => map.set(item.i, item));
    return map;
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
    cols,
    expandedFolderId: folderPanel.state.payload ?? null,
    setExpandedFolderId: (id: number | null) => {
      if (id == null) {
        folderPanel.close();
      }
    },
    onMoveToFolder,
    onMergeToFolder,
    rowHeight,
    margin: margin as [number, number],
  });

  const handleFolderOpen = useCallback(
    (tool: Tool) => {
      const folderEl = gridRef.current?.querySelector(`[data-tool-id="${tool.id}"]`);
      if (!folderEl) {
        return;
      }
      folderPanel.toggle(folderEl.getBoundingClientRect(), tool.id);
    },
    [gridRef, folderPanel.toggle]
  );

  const itemStyles = useMemo(() => {
    const styles = new Map<string, PanelGridItemStyle>();
    for (const item of layout) {
      styles.set(item.i, gridToPixels(item, width, cols, rowHeight, margin));
    }
    return styles;
  }, [layout, width, cols, rowHeight, margin]);

  const expandedFolderId = folderPanel.state.payload ?? null;
  const expandedFolder =
    expandedFolderId != null ? toolsMap.get(String(expandedFolderId)) ?? null : null;
  const expandedChildren =
    expandedFolderId != null ? childrenMap[expandedFolderId] ?? [] : [];
  const folderAnchorRect =
    folderPanel.state.phase !== "closed" ? (folderPanel.state.anchorRect as DOMRect) : null;

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
            Alt 已按下：拖动工具到文件夹或其他工具上方
          </div>
        )}
        <PanelGridCanvas
          gridRef={gridRef}
          width={width}
          totalHeight={totalHeight}
          cellWidth={cellWidth}
          rowHeight={rowHeight}
          margin={margin}
          tools={tools}
          activeId={activeId}
          dropTargetId={dropTargetId}
          itemStyles={itemStyles}
          childrenMap={childrenMap}
          listItemSize={listItemSize}
          onToolClick={onToolClick}
          onToolContextMenu={onToolContextMenu}
          onFolderOpen={handleFolderOpen}
          folderPopup={{
            isOpen: folderPanel.isOpen,
            folder: expandedFolder,
            childrenTools: expandedChildren,
            anchorRect: folderAnchorRect,
            onClose: () => folderPanel.markClosed(),
            onMoveOut: onMoveOutOfFolder,
          }}
        />
      </div>

      <ToolDragOverlay
        activeId={activeId}
        activeTool={activeTool ?? null}
        itemStyle={activeId ? itemStyles.get(activeId) : undefined}
        cellWidth={cellWidth}
        rowHeight={rowHeight}
        margin={margin}
        childrenMap={childrenMap}
        listItemSize={listItemSize}
      />
    </DndContext>
  );
}
