import type { Tool } from "../../types";
import type { FolderItem, LinkItem, PanelItem } from "./types";

function toolToLinkItem(tool: Tool): LinkItem {
  return {
    kind: "link",
    id: tool.id,
    name: tool.name,
    url: tool.url,
    logo: tool.logo,
    category: tool.category,
    description: tool.description,
    sort: tool.sort,
    size: tool.size,
    gridX: tool.gridX,
    gridY: tool.gridY,
    hide: tool.hide,
    viewMode: tool.viewMode,
  };
}

function toolToFolderItem(tool: Tool, children: LinkItem[]): FolderItem {
  return {
    kind: "folder",
    id: tool.id,
    name: tool.name,
    category: tool.category,
    sort: tool.sort,
    size: tool.size,
    gridX: tool.gridX,
    gridY: tool.gridY,
    folderTint: tool.folderTint,
    folderViewMode: tool.folderViewMode,
    folderItemSize: tool.folderItemSize,
    children,
  };
}

/** Build a children lookup map from all tools (keyed by parentId) */
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

/** Convert root-level Tool[] into PanelItem[] with embedded children */
export function adaptPanelItems(
  rootTools: Tool[],
  allTools: Tool[]
): PanelItem[] {
  const childrenMap = buildChildrenMap(allTools);

  return rootTools
    .map((tool) => {
      if (tool.type === "folder") {
        const childTools = childrenMap.get(tool.id) ?? [];
        return toolToFolderItem(tool, childTools.map(toolToLinkItem));
      }
      return toolToLinkItem(tool);
    })
    .sort((a, b) => a.sort - b.sort);
}

/** Convert all Tool[] into LinkItem[] (for search results, etc.) */
export function adaptLinkItems(tools: Tool[]): LinkItem[] {
  return tools.filter((t) => t.type !== "folder").map(toolToLinkItem);
}
