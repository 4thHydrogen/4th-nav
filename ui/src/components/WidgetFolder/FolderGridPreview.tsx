import { useMemo } from "react";
import type { Tool } from "../../types";
import { buildFolderPreviewSlots, previewGridCols, previewGridRows } from "./folderPreview";
import { FolderPreviewSlot } from "./FolderPreviewSlot";

interface FolderGridPreviewProps {
  childrenTools: Tool[];
  cols: number;
  rows: number;
  onOpenChild: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}

export function FolderGridPreview({
  childrenTools,
  cols,
  rows,
  onOpenChild,
  onContextMenu,
}: FolderGridPreviewProps) {
  const slots = useMemo(
    () => buildFolderPreviewSlots(childrenTools, cols, rows),
    [childrenTools, cols, rows],
  );

  const gridCols = previewGridCols(cols, rows);
  const gridRows = previewGridRows(cols, rows);

  return (
    <div
      className="widget-folder-preview"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${gridRows}, 1fr)`,
      }}
    >
      {slots.map((slot, i) => (
        <FolderPreviewSlot
          key={slot.tool?.id ?? `slot-${i}`}
          slot={slot}
          onOpenChild={onOpenChild}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}
