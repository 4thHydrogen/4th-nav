import type { Tool, ToolSize, ToolViewMode } from "../../types";

export const FOLDER_SIZES: ToolSize[] = ["1x1", "2x2", "3x2", "2x3", "3x3"];

export function toUpdateDto(tool: Tool) {
  return {
    ...tool,
    category: tool.category || "",
    description: tool.description || "",
    folderTint: tool.folderTint || "",
  };
}

export function parseSizeDims(size: string): [number, number] {
  const parts = size.split("x").map(Number);
  return [parts[0] || 1, parts[1] || 1];
}

export function getNextViewMode(viewMode: ToolViewMode): ToolViewMode {
  return viewMode === "card" ? "icon" : "card";
}

export function getContextMenuFolders(allTools: Tool[], tool: Tool) {
  if (tool.type === "folder") {
    return [];
  }
  return allTools.filter((item) => item.type === "folder" && item.id !== tool.id);
}
