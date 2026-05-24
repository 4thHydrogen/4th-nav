import { DragOverlay } from "@dnd-kit/core";
import WidgetFolder from "../../entities/folder/ui";
import WidgetTool from "../../entities/tool/ui/WidgetTool";
import type { Tool } from "../../types";

interface ToolDragOverlayProps {
  activeId: string | null;
  activeTool: Tool | null;
  itemStyle?: { width: number; height: number };
  cellWidth: number;
  rowHeight: number;
  margin: readonly [number, number];
  childrenMap: Record<number, Tool[]>;
  listItemSize: number;
}

export function ToolDragOverlay({
  activeId,
  activeTool,
  itemStyle,
  cellWidth,
  rowHeight,
  margin,
  childrenMap,
  listItemSize,
}: ToolDragOverlayProps) {
  return (
    <DragOverlay dropAnimation={null}>
      {activeId && activeTool ? (
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
          {activeTool.type === "folder" ? (
            <WidgetFolder
              folder={activeTool}
              childrenTools={childrenMap[activeTool.id] ?? []}
              listItemSize={listItemSize}
              onOpen={() => {}}
              onOpenChild={() => {}}
              onContextMenu={() => {}}
            />
          ) : (
            <WidgetTool tool={activeTool} onContextMenu={() => {}} onClick={() => {}} />
          )}
        </div>
      ) : null}
    </DragOverlay>
  );
}
