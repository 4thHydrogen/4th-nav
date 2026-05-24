import { useCallback } from "react";
import {
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import WidgetFolder from "../../entities/folder/ui";
import WidgetTool from "../../entities/tool/ui/WidgetTool";
import { FolderPopupHost } from "../folder-popup/FolderPopupHost";
import type { Tool } from "../../types";

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
  margin: readonly [number, number];
  tools: Tool[];
  activeId: string | null;
  dropTargetId: string | null;
  itemStyles: Map<string, PanelGridItemStyle>;
  childrenMap: Record<number, Tool[]>;
  listItemSize: number;
  onToolClick: (tool: Tool) => void;
  onToolContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onFolderOpen: (tool: Tool) => void;
  folderPopup: {
    isOpen: boolean;
    folder: Tool | null;
    childrenTools: Tool[];
    anchorRect: DOMRect | null;
    onClose: () => void;
    onMoveOut: (toolId: number) => void;
  };
}

interface DraggableItemProps {
  tool: Tool;
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
  tool,
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
}

export function PanelGridCanvas({
  gridRef,
  width,
  totalHeight,
  cellWidth,
  rowHeight,
  margin,
  tools,
  activeId,
  dropTargetId,
  itemStyles,
  childrenMap,
  listItemSize,
  onToolClick,
  onToolContextMenu,
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
        "--cell-gap-x": `${margin[0]}px`,
        "--cell-gap-y": `${margin[1]}px`,
      } as React.CSSProperties}
    >
      {tools.map((tool) => {
        const key = String(tool.id);
        const isFolder = tool.type === "folder";
        const children = isFolder ? childrenMap[tool.id] || [] : [];

        return (
          <GridItemHost
            key={key}
            tool={tool}
            itemStyle={itemStyles.get(key)}
            isDragging={activeId === key}
            isDropTarget={dropTargetId === key}
            childrenTools={children}
            listItemSize={listItemSize}
            onToolClick={onToolClick}
            onToolContextMenu={onToolContextMenu}
            onFolderOpen={onFolderOpen}
          />
        );
      })}

      <FolderPopupHost
        isOpen={folderPopup.isOpen}
        folder={folderPopup.folder}
        childrenTools={folderPopup.childrenTools}
        listItemSize={listItemSize}
        anchorRect={folderPopup.anchorRect}
        onClose={folderPopup.onClose}
        onOpenTool={onToolClick}
        onContextMenu={onToolContextMenu}
        onMoveOut={folderPopup.onMoveOut}
      />
    </div>
  );
}

function GridItemHost({
  tool,
  itemStyle,
  isDragging,
  isDropTarget,
  childrenTools,
  listItemSize,
  onToolClick,
  onToolContextMenu,
  onFolderOpen,
}: {
  tool: Tool;
  itemStyle: PanelGridItemStyle | undefined;
  isDragging: boolean;
  isDropTarget: boolean;
  childrenTools: Tool[];
  listItemSize: number;
  onToolClick: (tool: Tool) => void;
  onToolContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onFolderOpen: (tool: Tool) => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({
    id: String(tool.id),
  });
  const { setNodeRef: setDropRef } = useDroppable({ id: String(tool.id) });

  return (
    <DraggableItem
      tool={tool}
      style={itemStyle}
      isDropTarget={isDropTarget}
      isDragging={isDragging}
      dataToolId={String(tool.id)}
      setDragRef={setDragRef}
      setDropRef={setDropRef}
      attributes={attributes}
      listeners={listeners}
    >
      {tool.type === "folder" ? (
        <WidgetFolder
          folder={tool}
          childrenTools={childrenTools}
          listItemSize={listItemSize}
          onOpen={() => onFolderOpen(tool)}
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
}
