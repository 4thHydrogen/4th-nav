import type { FolderViewMode, ToolSize, ToolViewMode } from "../../types";

export type LinkItem = {
  kind: "link";
  id: number;
  name: string;
  url: string;
  logo: string;
  category: string;
  description: string;
  sort: number;
  size: ToolSize;
  gridX: number;
  gridY: number;
  hide: boolean;
  viewMode: ToolViewMode;
};

export type FolderItem = {
  kind: "folder";
  id: number;
  name: string;
  category: string;
  sort: number;
  size: ToolSize;
  gridX: number;
  gridY: number;
  folderTint: string;
  folderViewMode: FolderViewMode;
  folderItemSize: number;
  children: LinkItem[];
};

export type PanelItem = LinkItem | FolderItem;

export function isFolderItem(item: PanelItem): item is FolderItem {
  return item.kind === "folder";
}

export function isLinkItem(item: PanelItem): item is LinkItem {
  return item.kind === "link";
}
