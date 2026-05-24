import type {
  AddToolDto,
  AdminApiData,
  Category,
  ContentData,
  DockItem,
  PublicApiData,
  Tool,
  UpdateToolDto,
} from "../../types";

export const ALL_TOOLS_CATEGORY = "全部工具";

export const isFolderTool = (tool: Pick<Tool, "type">): tool is Tool & { type: "folder" } =>
  tool.type === "folder";

export const normalizeTool = (tool: Tool): Tool => ({
  ...tool,
  category: tool.category ?? "",
  description: tool.description ?? "",
  folderTint: tool.folderTint ?? "",
  viewMode: tool.viewMode ?? "icon",
  type: tool.type ?? "icon",
  size: tool.size ?? "1x1",
  gridX: typeof tool.gridX === "number" ? tool.gridX : -1,
  gridY: typeof tool.gridY === "number" ? tool.gridY : -1,
  folderViewMode: tool.folderViewMode ?? "grid",
  folderItemSize: tool.folderItemSize ?? 28,
});

export const normalizeToolPayload = (tool: Tool | AddToolDto | UpdateToolDto) => ({
  ...tool,
  category: tool.category ?? "",
  description: tool.description ?? "",
  folderTint: tool.folderTint ?? "",
  viewMode: tool.viewMode ?? "icon",
  type: tool.type ?? "icon",
  size: tool.size ?? "1x1",
  gridX: typeof tool.gridX === "number" ? tool.gridX : -1,
  gridY: typeof tool.gridY === "number" ? tool.gridY : -1,
  folderViewMode: tool.folderViewMode ?? "grid",
  folderItemSize: tool.folderItemSize ?? 28,
});

export const normalizeDockItem = (item: DockItem): DockItem => ({
  ...item,
  category: item.category ?? "",
  description: item.description ?? "",
});

export const buildCategoryNames = (categories: Category[], tools: Tool[]): string[] => {
  const names = [ALL_TOOLS_CATEGORY, ...categories.map((item) => item.name)];
  for (const tool of tools) {
    if (tool.category && !names.includes(tool.category)) {
      names.push(tool.category);
    }
  }
  return names;
};

export const normalizePublicApiData = (data: PublicApiData): ContentData => {
  const tools = (data.tools ?? []).map(normalizeTool);
  const categoryRecords = data.categories ?? [];
  const categories = buildCategoryNames(categoryRecords, tools);

  return {
    tools,
    categories,
    categoryRecords,
    setting: data.setting,
    siteConfig: data.siteConfig,
    dockItems: (data.dockItems ?? []).map(normalizeDockItem),
  };
};

export const normalizeAdminApiData = (data: AdminApiData): AdminApiData => ({
  tools: (data.tools ?? []).map(normalizeTool),
  categories: data.categories ?? [],
  setting: data.setting,
  siteConfig: data.siteConfig,
  user: data.user,
  tokens: data.tokens ?? [],
});
