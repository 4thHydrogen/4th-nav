import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentData, Tool } from "../types";

const hooksMock = vi.hoisted(() => ({
  useContentData: vi.fn(),
  useSearch: vi.fn(),
  useCategoryObserver: vi.fn(),
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

vi.mock("../components/LeftCategoryNav", () => ({
  default: ({ categories, activeCategory }: { categories: string[]; activeCategory: string }) => (
    <nav data-testid="left-category-nav" data-active={activeCategory}>
      {categories.map((category) => (
        <button key={category}>{category}</button>
      ))}
    </nav>
  ),
}));

vi.mock("../components/DesktopCategorySection", () => ({
  default: ({ category, items }: { category: string; items: Tool[] }) => (
    <section data-testid="desktop-category-section" aria-label={category}>
      <h2>{category}</h2>
      {items.map((item) => (
        <span key={item.id}>{item.name}</span>
      ))}
    </section>
  ),
}));

vi.mock("../components/ToolItem", () => ({
  default: ({ tool }: { tool: Tool }) => <a>{tool.name}</a>,
}));

vi.mock("../components/ToolContextMenu", () => ({
  default: () => <div data-testid="tool-context-menu" />,
}));

vi.mock("../components/GithubLink", () => ({
  default: () => <div data-testid="github-link" />,
}));

vi.mock("../components/DarkSwitch", () => ({
  default: () => <button data-testid="dark-switch" />,
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
  },
  siteConfig: {
    id: 1,
    noImageMode: false,
    compactMode: false,
    columnsPerRow: 6,
  },
});

describe("Content desktop workspace rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooksMock.useContentData.mockReturnValue({
      data: buildData(),
      loading: false,
      loadData: vi.fn().mockResolvedValue(buildData()),
      setData: vi.fn(),
    });
    hooksMock.useKeyboardNavigation.mockReturnValue(undefined);
    hooksMock.useBackgroundEffect.mockReturnValue(undefined);
    hooksMock.useCategoryObserver.mockReturnValue({
      visibleCategory: "Common",
      scrollToCategory: vi.fn(),
    });
  });

  it("renders the desktop workspace shell in grouped mode", async () => {
    const groupedData = {
      Common: [buildTool({ id: 1, name: "Docs", catelog: "Common" })],
      Dev: [buildTool({ id: 2, name: "Console", catelog: "Dev" })],
    };
    hooksMock.useSearch.mockReturnValue({
      val: "",
      searchString: "",
      filteredData: [],
      groupedData,
      handleSetSearch: vi.fn(),
      resetSearch: vi.fn(),
      restoreTag: vi.fn(),
      setVal: vi.fn(),
    });

    const Content = (await import("../components/Content")).default;
    const { container } = render(<Content />);

    expect(screen.getByRole("main")).toHaveClass("desktop-page");
    expect(container.querySelector(".desktop-hero")).not.toBeNull();
    expect(container.querySelector(".desktop-workspace")).not.toBeNull();
    expect(container.querySelector(".desktop-content-shell")).not.toBeNull();
    expect(screen.getByTestId("time-date-widget")).toBeInTheDocument();
    expect(screen.getByLabelText("homepage-search")).toBeInTheDocument();
    expect(screen.getByTestId("left-category-nav")).toHaveAttribute("data-active", "Common");
    expect(screen.getAllByTestId("desktop-category-section")).toHaveLength(2);
  });

  it("renders a flat result grid while searching", async () => {
    hooksMock.useSearch.mockReturnValue({
      val: "git",
      searchString: "git",
      filteredData: [buildTool({ id: 9, name: "GitHub" })],
      groupedData: {
        Common: [buildTool({ id: 1, name: "Docs" })],
      },
      handleSetSearch: vi.fn(),
      resetSearch: vi.fn(),
      restoreTag: vi.fn(),
      setVal: vi.fn(),
    });

    const Content = (await import("../components/Content")).default;
    const { container } = render(<Content />);

    expect(screen.queryByTestId("left-category-nav")).not.toBeInTheDocument();
    expect(screen.queryByTestId("desktop-category-section")).not.toBeInTheDocument();
    expect(container.querySelector(".desktop-tool-grid-flat")).not.toBeNull();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
  });
});
