// Entity types — mirror Go backend types/types.go

export type ToolViewMode = "icon" | "card";
export type ToolType = "icon" | "folder";
export type ToolSize = `${number}x${number}`;
export type FolderViewMode = "grid" | "list";

export interface Tool {
  id: number;
  name: string;
  url: string;
  logo: string;
  catelog: string;
  desc: string;
  sort: number;
  hide: boolean;
  viewMode: ToolViewMode;
  type: ToolType;
  parentId: number | null;
  size: ToolSize;
  bgColor: string;
  gridX: number;
  gridY: number;
  folderViewMode: FolderViewMode;
  folderItemSize: number;
}

export interface Catelog {
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
  enableGlassmorphism: boolean;
  pexelsApiKey: string;
  proxy: string;
}

export interface SiteConfig {
  id: number;
  noImageMode: boolean;
  compactMode: boolean;
  columnsPerRow: number;
  /** @deprecated Use density instead */
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

// API response envelope

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorMessage?: string;
}

// Composite API data

export interface PublicApiData {
  tools: Tool[];
  catelogs: Catelog[];
  setting: Setting;
  siteConfig: SiteConfig;
}

export interface AdminApiData {
  tools: Tool[];
  catelogs: Catelog[];
  setting: Setting;
  siteConfig: SiteConfig;
  user: Pick<User, "name" | "id">;
  tokens: Token[];
}

// Transformed data from FetchList()
export interface ContentData {
  tools: Tool[];
  catelogs: string[];
  setting: Setting;
  siteConfig: SiteConfig;
  dockItems: DockItem[];
}

export interface DockItem {
  id: number;
  sort: number;
  toolId: number;
  name: string;
  url: string;
  logo: string;
  catelog: string;
  desc: string;
}

// DTO types

export interface AddToolDto {
  name: string;
  url: string;
  logo: string;
  catelog: string;
  desc: string;
  sort: number;
  hide: boolean;
  viewMode: ToolViewMode;
  type: ToolType;
  parentId: number | null;
  size: ToolSize;
  bgColor: string;
  gridX: number;
  gridY: number;
  folderViewMode: FolderViewMode;
  folderItemSize: number;
}

export interface UpdateToolDto extends AddToolDto {
  id: number;
}

export interface AddCatelogDto {
  name: string;
  sort: number;
  hide: boolean;
}

export interface UpdateCatelogDto extends AddCatelogDto {
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

// Component prop types

export interface CardProps {
  title: string;
  url: string;
  des: string;
  logo: string;
  catelog: string;
  index: number;
  isSearching: boolean;
  noImageMode: boolean;
  compactMode: boolean;
  onClick: () => void;
}
