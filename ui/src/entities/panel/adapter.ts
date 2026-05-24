import type { Tool } from "../../types";

/** Build a children lookup map from all tools (for folder expansion in PanelGrid) */
export function buildChildrenMap(tools: Tool[]): Map<number, Tool[]> {
  const map = new Map<number, Tool[]>();
  for (const tool of tools) {
    if (tool.parentId != null) {
      const children = map.get(tool.parentId);
      if (children) {
        children.push(tool);
      } else {
        map.set(tool.parentId, [tool]);
      }
    }
  }
  return map;
}
