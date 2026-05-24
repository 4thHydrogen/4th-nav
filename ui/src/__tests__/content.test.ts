import { describe, expect, it } from "vitest";
import type { Tool } from "../types";

describe("Content filtering and grouping logic", () => {
  const mockTools: Tool[] = [
    {
      id: 1,
      name: "GitHub",
      url: "https://github.com",
      logo: "",
      category: "开发",
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
    },
    {
      id: 2,
      name: "Figma",
      url: "https://figma.com",
      logo: "",
      category: "设计",
      description: "",
      sort: 1,
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
    },
    {
      id: 3,
      name: "VSCode",
      url: "https://code.visualstudio.com",
      logo: "",
      category: "开发",
      description: "",
      sort: 2,
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
    },
    {
      id: 4,
      name: "Hidden Tool",
      url: "https://hidden.com",
      logo: "",
      category: "测试",
      description: "",
      sort: 3,
      hide: true,
      viewMode: "icon",
      type: "icon",
      parentId: null,
      size: "1x1",
      folderTint: "",
      gridX: -1,
      gridY: -1,
      folderViewMode: "grid",
      folderItemSize: 28,
    },
  ];

  it("filters tools by category", () => {
    const filtered = mockTools.filter((tool) => tool.category === "开发" && !tool.hide);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((tool) => tool.category === "开发")).toBe(true);
  });

  it("filters out hidden tools", () => {
    const visible = mockTools.filter((tool) => !tool.hide);
    expect(visible).toHaveLength(3);
  });

  it("groups tools by category", () => {
    const visible = mockTools.filter((tool) => !tool.hide);
    const groups: Record<string, Tool[]> = {};
    visible.forEach((item) => {
      const category = item.category || "未分类";
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    expect(Object.keys(groups)).toEqual(["开发", "设计"]);
    expect(groups["开发"]).toHaveLength(2);
    expect(groups["设计"]).toHaveLength(1);
  });

  it("sorts groups by category order", () => {
    const categoryOrder = ["设计", "开发", "其他"];
    const visible = mockTools.filter((tool) => !tool.hide);
    const groups: Record<string, Tool[]> = {};
    visible.forEach((item) => {
      const category = item.category || "未分类";
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });

    const ordered: Record<string, Tool[]> = {};
    categoryOrder.forEach((category) => {
      if (groups[category]) ordered[category] = groups[category];
    });
    Object.keys(groups).forEach((category) => {
      if (!ordered[category]) ordered[category] = groups[category];
    });

    expect(Object.keys(ordered)).toEqual(["设计", "开发"]);
  });

  it("search matches name, description, and url", () => {
    const search = (item: Tool, query: string) => {
      const normalizedQuery = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.url.toLowerCase().includes(normalizedQuery)
      );
    };
    expect(search(mockTools[0], "github")).toBe(true);
    expect(search(mockTools[0], "figma")).toBe(false);
    expect(search(mockTools[2], "code")).toBe(true);
  });
});
