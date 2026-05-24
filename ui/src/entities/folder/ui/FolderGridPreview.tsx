import { useMemo } from "react";
import type { LinkItem } from "../../panel/types";
import { buildFolderPreviewSlots, previewGridCols, previewGridRows } from "./folderPreview";
import { FolderPreviewSlot } from "./FolderPreviewSlot";

interface FolderGridPreviewProps {
  children: LinkItem[];
  cols: number;
  rows: number;
  onOpenChild: (item: LinkItem) => void;
  onContextMenu: (e: React.MouseEvent, item: LinkItem) => void;
}

export function FolderGridPreview({
  children,
  cols,
  rows,
  onOpenChild,
  onContextMenu,
}: FolderGridPreviewProps) {
  const slots = useMemo(
    () => buildFolderPreviewSlots(children, cols, rows),
    [children, cols, rows],
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
          key={slot.item?.id ?? `slot-${i}`}
          slot={slot}
          onOpenChild={onOpenChild}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}
