import { useCallback, useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { Tool } from "../../types";
import type { GridLayoutConfig } from "../../pages/home/useHomeLayoutVars";
import type { PanelItem, FolderItem, LinkItem } from "../../entities/panel/types";
import { isFolderItem } from "../../entities/panel/types";
import { useFloatingPanel } from "../../shared/ui/overlay/useFloatingPanel";
import { gridToPixels, type GridLayout, useGridLayout } from "./useGridLayout";
import { usePersistGridLayout } from "./usePersistGridLayout";
import { useGridDrag } from "./useGridDrag";
import { usePanelGridModel } from "./usePanelGridModel";
import { PanelGridCanvas, type PanelGridItemStyle } from "./PanelGridCanvas";
import { ToolDragOverlay } from "./ToolDragOverlay";
import "./panel-grid.css";

interface PanelGridProps {
  tools: Tool[];
  allTools: Tool[];
  noImageMode: boolean;
  listItemSize: number;
  layoutConfig?: GridLayoutConfig;
  onItemClick: (item: PanelItem) => void;
  onItemContextMenu: (e: React.MouseEvent, item: PanelItem) => void;
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
  layoutConfig,
  onItemClick,
  onItemContextMenu,
  onMoveToFolder,
  onMoveOutOfFolder,
  onMergeToFolder,
}: PanelGridProps) {
  const { panelItems, itemsMap } = usePanelGridModel(tools, allTools);

  const {
    layout,
    setLayout,
    wrapperRef,
    gridRef,
    width,
    cols,
    totalHeight,
    cellWidth,
    rowHeight,
    margin,
  } = useGridLayout(panelItems, layoutConfig);

  const isClampMode = useMemo(() => {
    const maxOriginalGridX = panelItems.reduce(
      (maxValue, item) => Math.max(maxValue, item.gridX >= 0 ? item.gridX : -1),
      -1
    );
    return maxOriginalGridX >= 0 && maxOriginalGridX >= cols;
  }, [panelItems, cols]);

  usePersistGridLayout(layout, !isClampMode);

  const layoutMap = useMemo(() => {
    const map = new Map<string, GridLayout>();
    layout.forEach((item) => map.set(item.i, item));
    return map;
  }, [layout]);

  const folderPanel = useFloatingPanel<number>();

  const {
    sensors,
    activeId,
    altHeld,
    dropTargetId,
    activeItem,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  } = useGridDrag({
    gridRef,
    layout,
    setLayout,
    layoutMap,
    itemsMap,
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
    (item: FolderItem) => {
      const folderEl = gridRef.current?.querySelector(`[data-tool-id="${item.id}"]`);
      if (!folderEl) {
        return;
      }
      folderPanel.toggle(folderEl.getBoundingClientRect(), item.id);
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
    expandedFolderId != null
      ? (() => {
          const item = itemsMap.get(String(expandedFolderId));
          return item && isFolderItem(item) ? item : null;
        })()
      : null;
  const folderAnchorRect =
    folderPanel.state.phase !== "closed" ? (folderPanel.state.anchorRect as DOMRect) : null;

  const handlePopupChildContextMenu = useCallback(
    (e: React.MouseEvent, item: LinkItem) => {
      onItemContextMenu(e, item);
    },
    [onItemContextMenu]
  );

  const handlePopupChildOpen = useCallback(
    (item: LinkItem) => {
      onItemClick(item);
    },
    [onItemClick]
  );

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
          items={panelItems}
          activeId={activeId}
          dropTargetId={dropTargetId}
          itemStyles={itemStyles}
          listItemSize={listItemSize}
          onItemClick={onItemClick}
          onItemContextMenu={onItemContextMenu}
          onFolderOpen={handleFolderOpen}
          folderPopup={{
            isOpen: folderPanel.isOpen,
            folder: expandedFolder,
            anchorRect: folderAnchorRect,
            onClose: () => folderPanel.markClosed(),
            onMoveOut: onMoveOutOfFolder,
            onContextMenu: handlePopupChildContextMenu,
            onOpenTool: handlePopupChildOpen,
          }}
        />
      </div>

      <ToolDragOverlay
        activeId={activeId}
        activeItem={activeItem ?? null}
        itemStyle={activeId ? itemStyles.get(activeId) : undefined}
        cellWidth={cellWidth}
        rowHeight={rowHeight}
        margin={margin}
        listItemSize={listItemSize}
      />
    </DndContext>
  );
}
