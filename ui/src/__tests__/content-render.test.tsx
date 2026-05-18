import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentData, Tool } from "../types";
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const queryMocks = vi.hoisted(() => ({
  useContentQuery: vi.fn(),
  useRefreshContent: vi.fn(),
  useUpdateViewMode: vi.fn(),
  useAddToDock: vi.fn(),
  useMoveToFolder: vi.fn(),
  useMergeToFolder: vi.fn(),
}));

vi.mock("../queries", () => queryMocks);

const storeState = {
  contextMenu: { visible: false, x: 0, y: 0, tool: null },
  openContextMenu: vi.fn(),
  closeContextMenu: vi.fn(),
  openFolder: null,
  setOpenFolder: vi.fn(),
  selectedCategories: new Set<string>(),
  toggleCategory: vi.fn(),
  clearFilters: vi.fn(),
  searchValue: "",
  setSearchValue: vi.fn(),
};

vi.mock("../stores/ui", () => ({
  useUIStore: () => storeState,
}));

const hooksMock = vi.hoisted(() => ({
  useSearch: vi.fn(),
  useKeyboardNavigation: vi.fn(),
  useBackgroundEffect: vi.fn(),
}));

vi.mock("../components/Content/hooks", () => hooksMock);

vi.mock("../components/Background", () => ({
  default: () => <div data-testid="background" />,
}));

vi.mock("../components/SearchBar", () => ({
  default: ({ searchString, setSearchText }: { searchString: string; setSearchText: (value: string) => void }) => (
    <input
      aria-label="homepage-search"
      value={searchString}
      onChange={(event) => setSearchText(event.target.value)}
    />
  ),
}));

vi.mock("../components/TimeDateWidget", () => ({
  default: () => <div data-testid="time-date-widget">12:30</div>,
}));

vi.mock("../components/ToolItem", () => ({
  default: ({ tool }: { tool: Tool }) => <a>{tool.name}</a>,
}));

vi.mock("../components/ToolContextMenu", () => ({
  default: () => <div data-testid="tool-context-menu" />,
}));

vi.mock("../components/FloatingActions", () => ({
  default: () => <div data-testid="floating-actions" />,
}));


vi.mock("../components/WidgetGrid", () => ({
  default: () => <div data-testid="widget-grid" />,
}));

vi.mock("../components/CategoryFilter", () => ({
  default: () => <div data-testid="category-filter" />,
}));

vi.mock("../components/DockBar", () => ({
  default: () => <div data-testid="dock-bar" />,
}));

vi.mock("../components/FolderOverlay", () => ({
  default: () => <div data-testid="folder-overlay" />,
}));

vi.mock("../components/Loading", () => ({
  Loading: () => <div data-testid="loading" />,
}));

vi.mock("react-helmet", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const buildTool = (overrides: Partial<Tool> = {}): Tool => ({
  id: 1,
  name: "Docs",
  url: "https://example.com",
  logo: "",
  catelog: "Common",
  desc: "",
  sort: 0,
  hide: false,
  viewMode: "icon",
  type: "icon",
  parentId: null,
  size: "1x1",
  bgColor: "",
  gridX: -1,
  gridY: -1,
  ...overrides,
});

const buildData = (): ContentData => ({
  tools: [buildTool()],
  catelogs: ["Common", "Dev"],
  setting: {
    id: 1,
    favicon: "",
    title: "4th Nav",
    govRecord: "",
    logo192: "",
    logo512: "",
    hideAdmin: false,
    hideGithub: false,
    hideToggleJumpTarget: false,
    jumpTargetBlank: true,
    backgroundUrl: "",
    enableBackground: false,
    enableGlassmorphism: false,
    pexelsApiKey: "",
  },
  siteConfig: {
    id: 1,
    noImageMode: false,
    compactMode: false,
    columnsPerRow: 6,
  },
  dockItems: [],
});

describe("Content desktop workspace rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryMocks.useContentQuery.mockReturnValue({
      data: buildData(),
      isLoading: false,
    });
    queryMocks.useRefreshContent.mockReturnValue(vi.fn());
    queryMocks.useUpdateViewMode.mockReturnValue({ mutate: vi.fn() });
    queryMocks.useAddToDock.mockReturnValue({ mutate: vi.fn() });
    queryMocks.useMoveToFolder.mockReturnValue({ mutate: vi.fn() });
    queryMocks.useMergeToFolder.mockReturnValue({ mutate: vi.fn() });
    hooksMock.useSearch.mockReturnValue({
      searchString: "",
      filteredData: [],
      handleSetSearch: vi.fn(),
      resetSearch: vi.fn(),
      restoreTag: vi.fn(),
    });
    hooksMock.useKeyboardNavigation.mockReturnValue(undefined);
    hooksMock.useBackgroundEffect.mockReturnValue(undefined);
  });

  it("renders the desktop workspace shell", async () => {
    const Content = (await import("../components/Content")).default;
    const { container } = render(<Content />);

    expect(screen.getByRole("main")).toHaveClass("desktop-page");
    expect(container.querySelector(".desktop-hero")).not.toBeNull();
    expect(container.querySelector(".desktop-workspace")).not.toBeNull();
    expect(container.querySelector(".desktop-content-shell")).not.toBeNull();
    expect(screen.getByTestId("time-date-widget")).toBeInTheDocument();
    expect(screen.getByLabelText("homepage-search")).toBeInTheDocument();
  });

  it("renders a flat result grid while searching", async () => {
    hooksMock.useSearch.mockReturnValue({
      searchString: "git",
      filteredData: [buildTool({ id: 9, name: "GitHub" })],
      handleSetSearch: vi.fn(),
      resetSearch: vi.fn(),
      restoreTag: vi.fn(),
    });

    const Content = (await import("../components/Content")).default;
    const { container } = render(<Content />);

    expect(container.querySelector(".desktop-tool-grid-flat")).not.toBeNull();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
  });
});
