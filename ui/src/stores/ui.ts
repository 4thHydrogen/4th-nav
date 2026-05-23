import { create } from "zustand";
import type { Tool } from "../types";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tool: Tool | null;
}

interface UIState {
  contextMenu: ContextMenuState;
  openContextMenu: (x: number, y: number, tool: Tool) => void;
  closeContextMenu: () => void;

  openFolder: Tool | null;
  setOpenFolder: (folder: Tool | null) => void;

  selectedCategories: Set<string>;
  toggleCategory: (cat: string) => void;
  clearFilters: () => void;

  searchValue: string;
  setSearchValue: (v: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  contextMenu: { visible: false, x: 0, y: 0, tool: null },
  openContextMenu: (x, y, tool) =>
    set({ contextMenu: { visible: true, x, y, tool } }),
  closeContextMenu: () =>
    set((s) => ({ contextMenu: { ...s.contextMenu, visible: false } })),

  openFolder: null,
  setOpenFolder: (folder) => set({ openFolder: folder }),

  selectedCategories: new Set<string>(),
  toggleCategory: (cat) =>
    set((s) => {
      const next = new Set(s.selectedCategories);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return { selectedCategories: next };
    }),
  clearFilters: () => set({ selectedCategories: new Set() }),

  searchValue: "",
  setSearchValue: (v) => set({ searchValue: v }),
}));
