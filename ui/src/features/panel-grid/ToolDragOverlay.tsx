import { DragOverlay } from "@dnd-kit/core";
import WidgetFolder from "../../entities/folder/ui";
import WidgetTool from "../../entities/tool/ui/WidgetTool";
import type { PanelItem, LinkItem } from "../../entities/panel/types";
import { isFolderItem } from "../../entities/panel/types";

interface ToolDragOverlayProps {
  activeId: string | null;
  activeItem: PanelItem | null;
  itemStyle?: { width: number; height: number };
  cellWidth: number;
  rowHeight: number;
  iconSize: number;
  margin: readonly [number, number];
  listItemSize: number;
}

export function ToolDragOverlay({
  activeId,
  activeItem,
  itemStyle,
  cellWidth,
  rowHeight,
  margin,
  listItemSize,
}: ToolDragOverlayProps) {
  const handleChildContextMenu = (e: React.MouseEvent, item: LinkItem) => {};
  const handleChildOpen = (item: LinkItem) => {};
  const handleFolderContextMenu = (e: React.MouseEvent) => {};

  return (
    <DragOverlay dropAnimation={null}>
      {activeId && activeItem ? (
        <div
          className="widget-grid-drag-overlay"
          style={{
            width: itemStyle?.width,
            height: itemStyle?.height,
            "--cell-width": `${cellWidth}px`,
            "--row-height": `${rowHeight}px`,
            "--cell-gap-x": `${margin[0]}px`,
            "--cell-gap-y": `${margin[1]}px`,
          } as React.CSSProperties}
        >
          {isFolderItem(activeItem) ? (
            <WidgetFolder
              folder={activeItem}
              listItemSize={listItemSize}
              onOpen={() => {}}
              onOpenChild={handleChildOpen}
              onContextMenu={handleFolderContextMenu}
              onChildContextMenu={handleChildContextMenu}
            />
          ) : (
            <WidgetTool item={activeItem} onContextMenu={() => {}} onClick={() => {}} />
          )}
        </div>
      ) : null}
    </DragOverlay>
  );
}
