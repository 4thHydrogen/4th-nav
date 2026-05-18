import { describe, it, expect, vi } from "vitest";

describe("useSearch", () => {
  it("exports useSearch hook", async () => {
    const mod = await import("../components/Content/hooks");
    expect(typeof mod.useSearch).toBe("function");
  });
});

describe("useCategoryObserver", () => {
  it("exports useCategoryObserver hook", async () => {
    const mod = await import("../components/Content/hooks");
    expect(typeof mod.useCategoryObserver).toBe("function");
  });
});

describe("useKeyboardNavigation", () => {
  it("exports useKeyboardNavigation hook", async () => {
    const mod = await import("../components/Content/hooks");
    expect(typeof mod.useKeyboardNavigation).toBe("function");
  });
});

describe("useBackgroundEffect", () => {
  it("exports useBackgroundEffect hook", async () => {
    const mod = await import("../components/Content/hooks");
    expect(typeof mod.useBackgroundEffect).toBe("function");
  });
});

describe("Content hooks filtering logic (unit)", () => {
  it("mutiSearch from admin utils matches Chinese pinyin", async () => {
    const { mutiSearch } = await import("../utils/admin");
    expect(mutiSearch("搜索引擎", "sousuo")).toBe(true);
    expect(mutiSearch("搜索引擎", "abc")).toBe(false);
  });

  it("mutiSearch matches case-insensitive substrings", async () => {
    const { mutiSearch } = await import("../utils/admin");
    expect(mutiSearch("React", "react")).toBe(true);
    expect(mutiSearch("Vue.js", "vue")).toBe(true);
  });
});
