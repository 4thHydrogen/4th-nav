import { describe, expect, it } from "vitest";
import type {
  AdminApiData,
  CardProps,
  Category,
  ContentData,
  SearchEngine,
  Setting,
  SiteConfig,
  Tool,
} from "../types";

describe("TypeScript types", () => {
  it("Tool interface supports canonical fields", () => {
    const tool: Tool = {
      id: 1,
      name: "Test",
      url: "https://example.com",
      logo: "test.ico",
      category: "工具",
      description: "A test tool",
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
    expect(tool.id).toBe(1);
    expect(tool.category).toBe("工具");
  });

  it("Category interface has required fields", () => {
    const category: Category = {
      id: 1,
      name: "开发工具",
      sort: 1,
      hide: false,
    };
    expect(category.name).toBe("开发工具");
  });

  it("Setting interface has background fields", () => {
    const setting: Setting = {
      id: 1,
      favicon: "",
      title: "Nav",
      govRecord: "",
      logo192: "",
      logo512: "",
      hideAdmin: false,
      hideGithub: false,
      hideToggleJumpTarget: false,
      jumpTargetBlank: true,
      backgroundUrl: "bing",
      enableBackground: true,
      enableSurfaceEffects: false,
      pexelsApiKey: "",
      proxy: "",
      iconProviderMode: "local-only",
      brandfetchClientId: "",
      enableBrandfetch: false,
      enableIconHorse: false,
    };
    expect(setting.enableBackground).toBe(true);
    expect(setting.backgroundUrl).toBe("bing");
  });

  it("SiteConfig interface has columnsPerRow", () => {
    const config: SiteConfig = {
      id: 1,
      noImageMode: false,
      compactMode: false,
      columnsPerRow: 4,
      folderListItemSize: 28,
    };
    expect(config.columnsPerRow).toBe(4);
  });

  it("ContentData exposes canonical category names", () => {
    const data: ContentData = {
      tools: [],
      categories: ["全部工具", "开发工具", "设计工具"],
      categoryRecords: [],
      setting: {} as Setting,
      siteConfig: {} as SiteConfig,
      dockItems: [],
    };
    expect(data.categories).toContain("全部工具");
    expect(data.categories?.[0]).toBe("全部工具");
  });

  it("CardProps has all required fields", () => {
    const props: CardProps = {
      title: "Test",
      url: "https://example.com",
      des: "desc",
      logo: "test.ico",
      category: "工具",
      index: 0,
      isSearching: false,
      noImageMode: false,
      compactMode: false,
      onClick: () => {},
    };
    expect(props.title).toBe("Test");
    expect(typeof props.onClick).toBe("function");
  });

  it("AdminApiData includes user and tokens", () => {
    const adminData: AdminApiData = {
      tools: [],
      categories: [],
      setting: {} as Setting,
      siteConfig: {} as SiteConfig,
      user: { name: "admin", id: 1 },
      tokens: [],
    };
    expect(adminData.user.name).toBe("admin");
    expect(adminData.tokens).toHaveLength(0);
  });

  it("SearchEngine remains compatible", () => {
    const engine: SearchEngine = {
      id: 1,
      name: "Google",
      baseUrl: "https://google.com/search",
      queryParam: "q",
      logo: "",
      sort: 0,
      enabled: true,
    };
    expect(engine.enabled).toBe(true);
  });
});
