import type { Tool } from "../../../types";

export function getFloatingWindowPosition(folderCardRect: DOMRect | null) {
  if (!folderCardRect) {
    return { left: 0, top: 0, width: "min(600px, calc(100vw - 24px))" };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const panelWidth = Math.min(viewportWidth * 0.72, 600);
  const panelHeight = Math.min(viewportHeight * 0.72, 500);

  let left = folderCardRect.left + folderCardRect.width / 2 - panelWidth / 2;
  if (left < 12) left = 12;
  if (left + panelWidth > viewportWidth - 12) {
    left = viewportWidth - panelWidth - 12;
  }

  let top = folderCardRect.top - 20;
  if (top < 12) top = 12;
  if (top + panelHeight > viewportHeight - 12) {
    top = viewportHeight - panelHeight - 12;
  }

  return {
    left,
    top,
    width: `min(${panelWidth}px, calc(100vw - 24px))`,
  };
}

export function getFolderDragHint(dragOutZone: boolean) {
  return dragOutZone ? "松开鼠标即可移出文件夹" : "拖到窗口外即可移出文件夹";
}

export function getFolderViewToggleTitle(viewMode: Tool["folderViewMode"]) {
  return viewMode === "grid" ? "切换到列表模式" : "切换到网格模式";
}
