import WidgetTool from "../../tool/ui/WidgetTool";
import type { Tool } from "../../../types";

interface FolderFloatingContentProps {
  viewMode: "grid" | "list";
  children: Tool[];
  draggingToolId: number | null;
  listItemSize: number;
  onPointerDown: (toolId: number, event: React.PointerEvent) => void;
  onContextMenu: (event: React.MouseEvent, tool: Tool) => void;
  onToolClick: (tool: Tool) => void;
}

export function FolderFloatingContent({
  viewMode,
  children,
  draggingToolId,
  listItemSize,
  onPointerDown,
  onContextMenu,
  onToolClick,
}: FolderFloatingContentProps) {
  if (viewMode === "list") {
    return (
      <div
        className="folder-floating-list"
        style={{ "--folder-list-item-size": `${listItemSize}px` } as React.CSSProperties}
      >
        {children.map((item) => (
          <div
            key={item.id}
            className={`folder-floating-item${draggingToolId === item.id ? " dragging" : ""}`}
            onPointerDown={(event) => onPointerDown(item.id, event)}
          >
            <WidgetTool
              tool={item}
              compact
              layout="list"
              onContextMenu={(event) => onContextMenu(event, item)}
              onClick={() => onToolClick(item)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="folder-floating-grid">
      {children.map((item) => (
        <div
          key={item.id}
          className={`folder-floating-item${draggingToolId === item.id ? " dragging" : ""}`}
          onPointerDown={(event) => onPointerDown(item.id, event)}
        >
          <WidgetTool
            tool={item}
            onContextMenu={(event) => onContextMenu(event, item)}
            onClick={() => onToolClick(item)}
          />
        </div>
      ))}
    </div>
  );
}
