import { describe, expect, it } from "vitest";
import type { Category } from "../types";
import { getFilter, getOptions, mutiSearch } from "../utils/admin";

describe("admin utilities", () => {
  const mockCategories: Category[] = [
    { id: 1, name: "开发工具", sort: 1, hide: false },
    { id: 2, name: "设计工具", sort: 2, hide: false },
    { id: 3, name: "隐藏分类", sort: 3, hide: true },
  ];

  describe("getOptions", () => {
    it("maps categories to select options", () => {
      const options = getOptions(mockCategories);
      expect(options).toHaveLength(3);
      expect(options[0]).toEqual({ label: "开发工具", value: "开发工具", key: 1 });
    });

    it("returns empty array for empty input", () => {
      expect(getOptions([])).toHaveLength(0);
    });
  });

  describe("getFilter", () => {
    it("maps categories to filter options", () => {
      const filters = getFilter(mockCategories);
      expect(filters).toHaveLength(3);
      expect(filters[0]).toEqual({ text: "开发工具", value: "开发工具" });
    });
  });

  describe("mutiSearch", () => {
    it("finds exact match", () => {
      expect(mutiSearch("Visual Studio Code", "visual")).toBe(true);
    });

    it("finds case-insensitive match", () => {
      expect(mutiSearch("React", "REACT")).toBe(true);
    });

    it("finds partial match", () => {
      expect(mutiSearch("GitHub Desktop", "git")).toBe(true);
    });

    it("returns false for no match", () => {
      expect(mutiSearch("React", "vue")).toBe(false);
    });

    it("handles empty search string", () => {
      expect(mutiSearch("React", "")).toBe(true);
    });

    it("handles Chinese characters", () => {
      expect(mutiSearch("百度搜索引擎", "百度")).toBe(true);
    });
  });
});
