import { useCallback, useEffect, useRef, useState } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { PanelItem } from "../../entities/panel/types";
import { isFolderItem } from "../../entities/panel/types";
import {
  moveItem,
  pixelsToGrid,
  type GridLayout,
} from "./useGridLayout";

interface UseGridDragParams {
  gridRef: React.RefObject<HTMLDivElement | null>;
  layout: GridLayout[];
  setLayout: (next: GridLayout[]) => void;
  layoutMap: Map<string, GridLayout>;
  itemsMap: Map<string, PanelItem>;
  cols: number;
  expandedFolderId: number | null;
  setExpandedFolderId: (id: number | null) => void;
  onMoveToFolder: (toolId: number, folderId: number) => void;
  onMergeToFolder: (
    toolId1: number,
    toolId2: number,
    pos1: { x: number; y: number },
    pos2: { x: number; y: number }
  ) => void;
  onLayoutChange?: (layout: GridLayout[]) => void;
  rowHeight?: number;
  margin?: [number, number];
}

export interface GridDragResult {
  sensors: ReturnType<typeof useSensors>;
  activeId: string | null;
  altHeld: boolean;
  dropTargetId: string | null;
  activeItem: PanelItem | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragMove: (event: DragMoveEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
}

function cloneLayout(layout: GridLayout[]) {
  return layout.map((item) => ({ ...item }));
}

function hasLayoutChanged(next: GridLayout[], current: GridLayout[]) {
  return next.some((item) => {
    const existing = current.find((currentItem) => currentItem.i === item.i);
    return !existing || existing.x !== item.x || existing.y !== item.y;
  });
}

function resetDragState(
  setActiveId: (id: string | null) => void,
  setDropTargetId: (id: string | null) => void,
  activeItemRef: React.MutableRefObject<PanelItem | null>,
  originLayoutRef: React.MutableRefObject<GridLayout[]>
) {
  setActiveId(null);
  setDropTargetId(null);
  activeItemRef.current = null;
  originLayoutRef.current = [];
}

function resolveDropAction({
  activeItem,
  activeId,
  dropTargetId,
  itemsMap,
  layoutMap,
  onMoveToFolder,
  onMergeToFolder,
}: {
  activeItem: PanelItem | null;
  activeId: string;
  dropTargetId: string | null;
  itemsMap: Map<string, PanelItem>;
  layoutMap: Map<string, GridLayout>;
  onMoveToFolder: (toolId: number, folderId: number) => void;
  onMergeToFolder: (
    toolId1: number,
    toolId2: number,
    pos1: { x: number; y: number },
    pos2: { x: number; y: number }
  ) => void;
}) {
  if (!activeItem || !dropTargetId) {
    return false;
  }

  const targetItem = itemsMap.get(dropTargetId);
  if (!targetItem) {
    return false;
  }

  if (isFolderItem(targetItem) && !isFolderItem(activeItem)) {
    onMoveToFolder(activeItem.id, targetItem.id);
    return true;
  }

  if (!isFolderItem(activeItem) && !isFolderItem(targetItem)) {
    const sourceLayout = layoutMap.get(activeId);
    const targetLayout = layoutMap.get(dropTargetId);
    onMergeToFolder(
      activeItem.id,
      targetItem.id,
      { x: sourceLayout?.x ?? 0, y: sourceLayout?.y ?? 0 },
      { x: targetLayout?.x ?? 0, y: targetLayout?.y ?? 0 }
    );
    return true;
  }

  return false;
}

export function useGridDrag({
  gridRef,
  layout,
  setLayout,
  layoutMap,
  itemsMap,
  cols,
  expandedFolderId,
  setExpandedFolderId,
  onMoveToFolder,
  onMergeToFolder,
  onLayoutChange,
  rowHeight,
  margin,
}: UseGridDragParams): GridDragResult {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [altHeld, setAltHeld] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const altRef = useRef(false);
  const activeItemRef = useRef<PanelItem | null>(null);
  const layoutRef = useRef(layout);
  const originLayoutRef = useRef<GridLayout[]>([]);

  layoutRef.current = layout;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        event.preventDefault();
        altRef.current = true;
        setAltHeld(true);
      }

      if (event.key === "Escape" && expandedFolderId != null) {
        setExpandedFolderId(null);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        altRef.current = false;
        setAltHeld(false);
        setDropTargetId(null);
      }
    };

    const handleBlur = () => {
      altRef.current = false;
      setAltHeld(false);
      setDropTargetId(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [expandedFolderId, setExpandedFolderId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveId(id);
      setDropTargetId(null);
      activeItemRef.current = itemsMap.get(id) ?? null;
      originLayoutRef.current = cloneLayout(layoutRef.current);
    },
    [itemsMap]
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const id = String(event.active.id);
      const itemLayout = layoutMap.get(id);
      if (!gridRef.current || !itemLayout) {
        return;
      }

      if (altRef.current) {
        setDropTargetId(event.over ? String(event.over.id) : null);
        return;
      }

      const translated = event.active.rect.current.translated;
      if (!translated) {
        return;
      }

      const target = pixelsToGrid(
        translated.left,
        translated.top,
        gridRef.current.getBoundingClientRect(),
        itemLayout.w,
        cols,
        rowHeight,
        margin
      );

      const baseLayout =
        originLayoutRef.current.length > 0 ? originLayoutRef.current : layout;
      const nextLayout = moveItem(baseLayout, id, target.x, target.y, cols);

      if (hasLayoutChanged(nextLayout, layoutRef.current)) {
        setLayout(nextLayout);
      }
    },
    [cols, gridRef, layout, layoutMap, margin, rowHeight, setLayout]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const id = String(event.active.id);
      const handledAsFolderAction =
        altRef.current &&
        resolveDropAction({
          activeItem: activeItemRef.current,
          activeId: id,
          dropTargetId,
          itemsMap,
          layoutMap,
          onMoveToFolder,
          onMergeToFolder,
        });

      if (!handledAsFolderAction) {
        setLayout(layoutRef.current);
        onLayoutChange?.(layoutRef.current);
      }

      resetDragState(
        setActiveId,
        setDropTargetId,
        activeItemRef,
        originLayoutRef
      );
    },
    [
      dropTargetId,
      layoutMap,
      onMergeToFolder,
      onMoveToFolder,
      itemsMap,
      setLayout,
    ]
  );

  const handleDragCancel = useCallback(() => {
    resetDragState(
      setActiveId,
      setDropTargetId,
      activeItemRef,
      originLayoutRef
    );
  }, []);

  const activeItem = activeId ? itemsMap.get(activeId) ?? null : null;

  return {
    sensors,
    activeId,
    altHeld,
    dropTargetId,
    activeItem,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}
