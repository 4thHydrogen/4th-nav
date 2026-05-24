import { useCallback } from "react";
import {
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import WidgetFolder from "../../entities/folder/ui";
import WidgetTool from "../../entities/tool/ui/WidgetTool";
import { FolderPopupHost } from "../folder-popup/FolderPopupHost";
import type { PanelItem, LinkItem, FolderItem } from "../../entities/panel/types";
import { isFolderItem } from "../../entities/panel/types";

export interface PanelGridItemStyle {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PanelGridCanvasProps {
  gridRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  totalHeight: number;
  cellWidth: number;
  rowHeight: number;
  iconSize: number;
  margin: readonly [number, number];
  items: PanelItem[];
  activeId: string | null;
  dropTargetId: string | null;
  itemStyles: Map<string, PanelGridItemStyle>;
  listItemSize: number;
  onItemClick: (item: PanelItem) => void;
  onItemContextMenu: (e: React.MouseEvent, item: PanelItem) => void;
  onFolderOpen: (item: FolderItem) => void;
  folderPopup: {
    isOpen: boolean;
    folder: FolderItem | null;
    anchorRect: DOMRect | null;
    onClose: () => void;
    onMoveOut: (toolId: number) => void;
    onContextMenu: (e: React.MouseEvent, item: LinkItem) => void;
    onOpenTool: (item: LinkItem) => void;
  };
}

interface DraggableItemProps {
  item: PanelItem;
  style: PanelGridItemStyle | undefined;
  isDropTarget: boolean;
  isDragging: boolean;
  children: React.ReactNode;
  dataToolId?: string;
  setDragRef: (node: HTMLDivElement | null) => void;
  setDropRef: (node: HTMLDivElement | null) => void;
  attributes: any;
  listeners: any;
}

function DraggableItem({
  item,
  style,
  isDropTarget,
  isDragging,
  children,
  dataToolId,
  setDragRef,
  setDropRef,
  attributes,
  listeners,
}: DraggableItemProps) {
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
      data-grid-id={item.id}
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
}

export function PanelGridCanvas({
  gridRef,
  width,
  totalHeight,
  cellWidth,
  rowHeight,
  iconSize,
  margin,
  items,
  activeId,
  dropTargetId,
  itemStyles,
  listItemSize,
  onItemClick,
  onItemContextMenu,
  onFolderOpen,
  folderPopup,
}: PanelGridCanvasProps) {
  if (width <= 0) {
    return null;
  }

  return (
    <div
      ref={gridRef}
      className="widget-grid-container"
      style={{
        position: "relative" as const,
        height: totalHeight,
        "--cell-width": `${cellWidth}px`,
        "--row-height": `${rowHeight}px`,
        "--cell-size": `${cellWidth}px`,
        "--icon-size": `${iconSize}px`,
        "--cell-gap-x": `${margin[0]}px`,
        "--cell-gap-y": `${margin[1]}px`,
      } as React.CSSProperties}
    >
      {items.map((item) => {
        const key = String(item.id);

        return (
          <GridItemHost
            key={key}
            item={item}
            itemStyle={itemStyles.get(key)}
            isDragging={activeId === key}
            isDropTarget={dropTargetId === key}
            listItemSize={listItemSize}
            onItemClick={onItemClick}
            onItemContextMenu={onItemContextMenu}
            onFolderOpen={onFolderOpen}
          />
        );
      })}

      <FolderPopupHost
        isOpen={folderPopup.isOpen}
        folder={folderPopup.folder}
        listItemSize={listItemSize}
        anchorRect={folderPopup.anchorRect}
        onClose={folderPopup.onClose}
        onOpenTool={folderPopup.onOpenTool}
        onContextMenu={folderPopup.onContextMenu}
        onMoveOut={folderPopup.onMoveOut}
      />
    </div>
  );
}

function GridItemHost({
  item,
  itemStyle,
  isDragging,
  isDropTarget,
  listItemSize,
  onItemClick,
  onItemContextMenu,
  onFolderOpen,
}: {
  item: PanelItem;
  itemStyle: PanelGridItemStyle | undefined;
  isDragging: boolean;
  isDropTarget: boolean;
  listItemSize: number;
  onItemClick: (item: PanelItem) => void;
  onItemContextMenu: (e: React.MouseEvent, item: PanelItem) => void;
  onFolderOpen: (item: FolderItem) => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({
    id: String(item.id),
  });
  const { setNodeRef: setDropRef } = useDroppable({ id: String(item.id) });

  const handleChildContextMenu = (e: React.MouseEvent, child: LinkItem) => {
    onItemContextMenu(e, child);
  };

  const handleChildOpen = (child: LinkItem) => {
    onItemClick(child);
  };

  return (
    <DraggableItem
      item={item}
      style={itemStyle}
      isDropTarget={isDropTarget}
      isDragging={isDragging}
      dataToolId={String(item.id)}
      setDragRef={setDragRef}
      setDropRef={setDropRef}
      attributes={attributes}
      listeners={listeners}
    >
      {isFolderItem(item) ? (
        <WidgetFolder
          folder={item}
          listItemSize={listItemSize}
          onOpen={() => onFolderOpen(item)}
          onOpenChild={handleChildOpen}
          onContextMenu={(e) => onItemContextMenu(e, item)}
          onChildContextMenu={handleChildContextMenu}
        />
      ) : (
        <WidgetTool
          item={item}
          onContextMenu={(e) => onItemContextMenu(e, item)}
          onClick={() => onItemClick(item)}
        />
      )}
    </DraggableItem>
  );
}
