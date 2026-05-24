import WidgetTool from "../../tool/ui/WidgetTool";
import type { LinkItem } from "../../panel/types";

interface FolderFloatingContentProps {
  viewMode: "grid" | "list";
  children: LinkItem[];
  draggingToolId: number | null;
  listItemSize: number;
  onPointerDown: (toolId: number, event: React.PointerEvent) => void;
  onContextMenu: (event: React.MouseEvent, item: LinkItem) => void;
  onToolClick: (item: LinkItem) => void;
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
              item={item}
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
            item={item}
            onContextMenu={(event) => onContextMenu(event, item)}
            onClick={() => onToolClick(item)}
          />
        </div>
      ))}
    </div>
  );
}
