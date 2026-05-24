import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/ui";
import type { Tool } from "../types";

const mockTool: Tool = {
  id: 1,
  name: "GitHub",
  url: "https://github.com",
  logo: "",
  category: "dev",
  description: "",
  sort: 0,
  hide: false,
  viewMode: "icon",
  type: "icon",
  parentId: null,
  size: "1x1",
  folderTint: "",
  gridX: -1,
  gridY: -1,
  folderViewMode: "grid",
  folderItemSize: 28,
};

const mockFolder: Tool = {
  ...mockTool,
  id: 2,
  name: "Design Tools",
  type: "folder",
};

const initialState = {
  contextMenu: { visible: false, x: 0, y: 0, tool: null },
  openFolder: null,
  selectedCategories: new Set<string>(),
  searchValue: "",
};

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState(initialState);
  });

  describe("initial state", () => {
    it("has contextMenu.visible as false with x/y as 0 and tool as null", () => {
      const { contextMenu } = useUIStore.getState();
      expect(contextMenu.visible).toBe(false);
      expect(contextMenu.x).toBe(0);
      expect(contextMenu.y).toBe(0);
      expect(contextMenu.tool).toBeNull();
    });

    it("has openFolder as null", () => {
      expect(useUIStore.getState().openFolder).toBeNull();
    });

    it("has an empty selectedCategories Set", () => {
      const { selectedCategories } = useUIStore.getState();
      expect(selectedCategories).toBeInstanceOf(Set);
      expect(selectedCategories.size).toBe(0);
    });

    it("has searchValue as empty string", () => {
      expect(useUIStore.getState().searchValue).toBe("");
    });
  });

  describe("openContextMenu / closeContextMenu", () => {
    it("openContextMenu sets visible=true, x, y, and tool", () => {
      useUIStore.getState().openContextMenu(100, 200, mockTool);

      const { contextMenu } = useUIStore.getState();
      expect(contextMenu.visible).toBe(true);
      expect(contextMenu.x).toBe(100);
      expect(contextMenu.y).toBe(200);
      expect(contextMenu.tool).toEqual(mockTool);
    });

    it("closeContextMenu sets visible=false while keeping other fields", () => {
      useUIStore.getState().openContextMenu(50, 75, mockTool);
      useUIStore.getState().closeContextMenu();

      const { contextMenu } = useUIStore.getState();
      expect(contextMenu.visible).toBe(false);
      expect(contextMenu.x).toBe(50);
      expect(contextMenu.y).toBe(75);
      expect(contextMenu.tool).toEqual(mockTool);
    });

    it("allows opening again after close", () => {
      useUIStore.getState().openContextMenu(10, 20, mockTool);
      useUIStore.getState().closeContextMenu();
      useUIStore.getState().openContextMenu(30, 40, mockFolder);

      const { contextMenu } = useUIStore.getState();
      expect(contextMenu.visible).toBe(true);
      expect(contextMenu.x).toBe(30);
      expect(contextMenu.y).toBe(40);
      expect(contextMenu.tool).toEqual(mockFolder);
    });
  });

  describe("openFolder / setOpenFolder", () => {
    it("setOpenFolder sets the folder", () => {
      useUIStore.getState().setOpenFolder(mockFolder);

      expect(useUIStore.getState().openFolder).toEqual(mockFolder);
    });

    it("setting null clears the folder", () => {
      useUIStore.getState().setOpenFolder(mockFolder);
      useUIStore.getState().setOpenFolder(null);

      expect(useUIStore.getState().openFolder).toBeNull();
    });

    it("setting a new folder replaces the old one", () => {
      useUIStore.getState().setOpenFolder(mockTool);
      useUIStore.getState().setOpenFolder(mockFolder);

      expect(useUIStore.getState().openFolder).toEqual(mockFolder);
      expect(useUIStore.getState().openFolder!.id).toBe(2);
    });
  });

  describe("toggleCategory", () => {
    it("adds a category to an empty set", () => {
      useUIStore.getState().toggleCategory("dev");

      const cats = useUIStore.getState().selectedCategories;
      expect(cats.has("dev")).toBe(true);
      expect(cats.size).toBe(1);
    });

    it("adds a second category", () => {
      useUIStore.getState().toggleCategory("dev");
      useUIStore.getState().toggleCategory("design");

      const cats = useUIStore.getState().selectedCategories;
      expect(cats.has("dev")).toBe(true);
      expect(cats.has("design")).toBe(true);
      expect(cats.size).toBe(2);
    });

    it("removes an existing category (toggle off)", () => {
      useUIStore.getState().toggleCategory("dev");
      useUIStore.getState().toggleCategory("dev");

      const cats = useUIStore.getState().selectedCategories;
      expect(cats.has("dev")).toBe(false);
      expect(cats.size).toBe(0);
    });

    it("toggling a non-existent category adds it", () => {
      const cats = useUIStore.getState().selectedCategories;
      expect(cats.has("tools")).toBe(false);

      useUIStore.getState().toggleCategory("tools");

      expect(useUIStore.getState().selectedCategories.has("tools")).toBe(true);
    });

    it("handles multiple toggles correctly", () => {
      useUIStore.getState().toggleCategory("a");
      useUIStore.getState().toggleCategory("b");
      useUIStore.getState().toggleCategory("a");
      useUIStore.getState().toggleCategory("c");

      const cats = useUIStore.getState().selectedCategories;
      expect(cats.has("a")).toBe(false);
      expect(cats.has("b")).toBe(true);
      expect(cats.has("c")).toBe(true);
      expect(cats.size).toBe(2);
    });
  });

  describe("clearFilters", () => {
    it("clears all selected categories", () => {
      useUIStore.getState().toggleCategory("dev");
      useUIStore.getState().toggleCategory("design");
      useUIStore.getState().clearFilters();

      expect(useUIStore.getState().selectedCategories.size).toBe(0);
    });

    it("works on empty set without error", () => {
      expect(() => useUIStore.getState().clearFilters()).not.toThrow();
      expect(useUIStore.getState().selectedCategories.size).toBe(0);
    });
  });

  describe("searchValue / setSearchValue", () => {
    it("updates the search value", () => {
      useUIStore.getState().setSearchValue("github");

      expect(useUIStore.getState().searchValue).toBe("github");
    });

    it("setting empty string works", () => {
      useUIStore.getState().setSearchValue("test");
      useUIStore.getState().setSearchValue("");

      expect(useUIStore.getState().searchValue).toBe("");
    });

    it("handles long strings", () => {
      const longQuery = "a".repeat(10000);
      useUIStore.getState().setSearchValue(longQuery);

      expect(useUIStore.getState().searchValue).toBe(longQuery);
      expect(useUIStore.getState().searchValue.length).toBe(10000);
    });
  });

  describe("state independence", () => {
    it("changing searchValue does not affect contextMenu", () => {
      useUIStore.getState().openContextMenu(10, 20, mockTool);
      useUIStore.getState().setSearchValue("test");

      const { contextMenu, searchValue } = useUIStore.getState();
      expect(contextMenu.visible).toBe(true);
      expect(contextMenu.x).toBe(10);
      expect(contextMenu.y).toBe(20);
      expect(searchValue).toBe("test");
    });
  });
});
