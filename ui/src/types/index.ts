export type ToolViewMode = "icon" | "card";
export type ToolKind = "icon" | "folder";
export type ToolType = ToolKind;
export type ToolSize = `${number}x${number}`;
export type FolderViewMode = "grid" | "list";

export interface Tool {
  id: number;
  name: string;
  url: string;
  logo: string;
  category: string;
  description: string;
  sort: number;
  hide: boolean;
  viewMode: ToolViewMode;
  type: ToolKind;
  parentId: number | null;
  size: ToolSize;
  folderTint: string;
  gridX: number;
  gridY: number;
  folderViewMode: FolderViewMode;
  folderItemSize: number;
  iconStatus?: string;
  iconError?: string;
  iconUpdatedAt?: number;
  iconSource?: string;
}

export interface FolderRecord extends Tool {
  type: "folder";
}

export interface Category {
  id: number;
  name: string;
  sort: number;
  hide: boolean;
}

export interface Setting {
  id: number;
  favicon: string;
  title: string;
  govRecord: string;
  logo192: string;
  logo512: string;
  hideAdmin: boolean;
  hideGithub: boolean;
  hideToggleJumpTarget: boolean;
  jumpTargetBlank: boolean;
  backgroundUrl: string;
  enableBackground: boolean;
  enableSurfaceEffects: boolean;
  pexelsApiKey: string;
  proxy: string;
  iconProviderMode: string;
  brandfetchClientId: string;
  enableBrandfetch: boolean;
  enableIconHorse: boolean;
}

export interface SiteConfig {
  id: number;
  noImageMode: boolean;
  compactMode: boolean;
  columnsPerRow: number;
  iconSize?: number;
  density?: "compact" | "standard" | "relaxed";
  folderListItemSize: number;
}

export interface SearchEngine {
  id: number;
  name: string;
  baseUrl: string;
  queryParam: string;
  logo: string;
  sort: number;
  enabled: boolean;
}

export interface Token {
  id: number;
  name: string;
  value: string;
  disabled: number;
}

export interface User {
  id: number;
  name: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorMessage?: string;
}

export interface DockItem {
  id: number;
  sort: number;
  toolId: number;
  name: string;
  url: string;
  logo: string;
  category: string;
  description: string;
}

export interface PublicApiData {
  tools: Tool[];
  categories: Category[];
  setting: Setting;
  siteConfig: SiteConfig;
  dockItems?: DockItem[];
}

export interface AdminApiData {
  tools: Tool[];
  categories: Category[];
  setting: Setting;
  siteConfig: SiteConfig;
  user: Pick<User, "name" | "id">;
  tokens: Token[];
}

export interface ContentData {
  tools: Tool[];
  categories: string[];
  categoryRecords: Category[];
  setting: Setting;
  siteConfig: SiteConfig;
  dockItems: DockItem[];
}

export interface AddToolDto {
  name: string;
  url: string;
  logo: string;
  category: string;
  description: string;
  sort: number;
  hide: boolean;
  viewMode: ToolViewMode;
  type: ToolKind;
  parentId: number | null;
  size: ToolSize;
  folderTint: string;
  gridX: number;
  gridY: number;
  folderViewMode: FolderViewMode;
  folderItemSize: number;
}

export interface UpdateToolDto extends AddToolDto {
  id: number;
}

export interface AddCategoryDto {
  name: string;
  sort: number;
  hide: boolean;
}

export interface UpdateCategoryDto extends AddCategoryDto {
  id: number;
}

export interface UpdateUserDto {
  id: number;
  name: string;
  password: string;
}

export interface AddTokenDto {
  name: string;
}

export interface SortUpdateDto {
  id: number;
  sort: number;
}

export interface LayoutItemDto {
  id: number;
  gridX: number;
  gridY: number;
  w: number;
  h: number;
}

export interface CardProps {
  title: string;
  url: string;
  des: string;
  logo: string;
  category?: string;
  index: number;
  isSearching: boolean;
  noImageMode: boolean;
  compactMode: boolean;
  onClick: () => void;
}
