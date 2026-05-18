import { useCallback, useEffect, useRef, useState } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Tool } from "../../types";
import {
  gridToPixels,
  pixelsToGrid,
  moveItem,
  ROW_HEIGHT,
  MARGIN,
  type GridLayout,
} from "./useGridLayout";

interface UseGridDragParams {
  gridRef: React.RefObject<HTMLDivElement | null>;
  layout: GridLayout[];
  setLayout: (next: GridLayout[]) => void;
  updateLayout: (next: GridLayout[]) => void;
  layoutMap: Map<string, GridLayout>;
  toolsMap: Map<string, Tool>;
  folderIds: Set<string>;
  width: number;
  cols: number;
  expandedFolderId: number | null;
  setExpandedFolderId: (id: number | null) => void;
  onMoveToFolder: (toolId: number, folderId: number) => void;
  onMergeToFolder: (toolId1: number, toolId2: number) => void;
  rowHeight?: number;
  margin?: [number, number];
}

export interface GridDragResult {
  sensors: ReturnType<typeof useSensors>;
  activeId: string | null;
  altHeld: boolean;
  dropTargetId: string | null;
  activeTool: Tool | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragMove: (event: DragMoveEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
}

export function useGridDrag({
  gridRef,
  layout,
  setLayout,
  updateLayout,
  layoutMap,
  toolsMap,
  folderIds,
  width,
  cols,
  expandedFolderId,
  setExpandedFolderId,
  onMoveToFolder,
  onMergeToFolder,
  rowHeight = ROW_HEIGHT,
  margin = [...MARGIN] as [number, number],
}: UseGridDragParams): GridDragResult {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [altHeld, setAltHeld] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const altRef = useRef(false);
  const activeToolRef = useRef<Tool | null>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  // dragStart 时快照原始 layout — dragMove 始终基于此计算，保证用户拖回原位时被挤开的卡片归位
  const originLayoutRef = useRef<GridLayout[]>([]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        e.preventDefault();
        altRef.current = true;
        setAltHeld(true);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        altRef.current = false;
        setAltHeld(false);
        setDropTargetId(null);
      }
    };
    const onBlur = () => {
      altRef.current = false;
      setAltHeld(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expandedFolderId != null) {
        setExpandedFolderId(null);
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onEsc);
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
      activeToolRef.current = toolsMap.get(id) ?? null;
      // 深拷贝当前 layout 作为原始快照，dragMove 始终基于它计算
      originLayoutRef.current = layoutRef.current.map((l) => ({ ...l }));
    },
    [toolsMap]
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (!gridRef.current) return;
      const id = String(event.active.id);
      const itemLayout = layoutMap.get(id);
      if (!itemLayout) return;

      if (altRef.current) {
        const { active } = event;
        const containerRect = gridRef.current.getBoundingClientRect();
        const translated = active.rect.current.translated;
        if (!translated) return;

        const cx = translated.left + (itemLayout.w * ((containerRect.width - (cols - 1) * margin[0]) / cols)) / 2;
        const cy = translated.top + itemLayout.h * rowHeight / 2;

        let found: string | null = null;
        for (const [lid, l] of layoutMap) {
          if (lid === id) continue;
          const px = gridToPixels(l, width, cols, rowHeight, margin);
          if (
            cx >= px.left &&
            cx <= px.left + px.width &&
            cy >= px.top &&
            cy <= px.top + px.height
          ) {
            found = lid;
            break;
          }
        }
        setDropTargetId(found);
      } else {
        const { active } = event;
        const containerRect = gridRef.current.getBoundingClientRect();
        const translated = active.rect.current.translated;
        if (!translated) return;

        // translated.left/top 已隐含 grabOffset（= cursor - grab 偏移）
        // 直接表示"卡片左上角的预期屏幕位置"，与卡片尺寸 / 抓握点完全无关
        // pixelsToGrid 内部用 round(top / pitch) 公式，切换边界落在两个位置的中点
        const target = pixelsToGrid(
          translated.left,
          translated.top,
          containerRect,
          itemLayout.w,
          cols,
          rowHeight,
          margin
        );

        // 始终基于 dragStart 时的原始 layout 计算，使被挤开的卡片在用户拖回原位时归位
        const baseLayout = originLayoutRef.current.length > 0
          ? originLayoutRef.current
          : layout;
        const next = moveItem(baseLayout, id, target.x, target.y, cols);
        const changed = next.some((l) => {
          const orig = layoutRef.current.find((o) => o.i === l.i);
          return !orig || orig.x !== l.x || orig.y !== l.y;
        });
        if (changed) setLayout(next);
      }
    },
    [gridRef, layoutMap, width, cols, setLayout]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const id = String(event.active.id);
      const tool = activeToolRef.current;

      if (altRef.current && tool && dropTargetId) {
        const targetTool = toolsMap.get(dropTargetId);
        if (targetTool) {
          if (targetTool.type === "folder") {
            onMoveToFolder(tool.id, targetTool.id);
          } else if (!folderIds.has(id)) {
            onMergeToFolder(tool.id, targetTool.id);
          }
        }
      } else {
        updateLayout(layoutRef.current);
      }

      setActiveId(null);
      setDropTargetId(null);
      activeToolRef.current = null;
      originLayoutRef.current = [];
    },
    [dropTargetId, toolsMap, folderIds, onMoveToFolder, onMergeToFolder, updateLayout]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDropTargetId(null);
    activeToolRef.current = null;
    originLayoutRef.current = [];
  }, []);

  const activeTool = activeId ? toolsMap.get(activeId) ?? null : null;

  return {
    sensors,
    activeId,
    altHeld,
    dropTargetId,
    activeTool,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}
