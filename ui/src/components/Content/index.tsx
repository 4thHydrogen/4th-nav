import "./index.css";
import SearchBar from "../SearchBar";
import { Loading } from "../Loading";
import { Helmet } from "react-helmet";
import { useCallback, useEffect, useMemo, useState } from "react";
import FloatingActions from "../FloatingActions";
import { initServerJumpTargetConfig } from "../../utils/setting";
import { parsePexelsUrl, clearPexelsCache } from "../../utils/pexels";
import { applyTheme, decodeTheme, initTheme } from "../../utils/theme";
import Background from "../Background";
import ToolContextMenu from "../ToolContextMenu";
import ToolItem from "../ToolItem";
import TimeDateWidget from "../TimeDateWidget";
import DockBar from "../DockBar";
import WidgetGrid from "../WidgetGrid";
import CategoryFilter from "../CategoryFilter";
import type { SearchEngine, Tool } from "../../types";
import {
  useContentQuery,
  useRefreshContent,
  useUpdateViewMode,
  useAddToDock,
  useMoveToFolder,
  useMergeToFolder,
} from "../../queries";
import { useUIStore } from "../../stores/ui";
import {
  useSearch,
  useKeyboardNavigation,
  useBackgroundEffect,
} from "./hooks";

const Content = () => {
  const { data, isLoading } = useContentQuery();
  const refreshContent = useRefreshContent();
  const updateViewMode = useUpdateViewMode();
  const addToDock = useAddToDock();
  const moveToFolder = useMoveToFolder();
  const mergeToFolder = useMergeToFolder();

  const {
    contextMenu,
    openContextMenu,
    closeContextMenu,
    selectedCategories,
    toggleCategory,
    clearFilters,
    searchValue,
    setSearchValue,
  } = useUIStore();

  const {
    searchString,
    filteredData,
    handleSetSearch,
    resetSearch,
    restoreTag,
  } = useSearch(data);

  const [selectedEngine, setSelectedEngine] = useState<SearchEngine | null>(null);

  useKeyboardNavigation(searchString, filteredData, resetSearch, selectedEngine);
  useBackgroundEffect(
    data?.setting?.enableGlassmorphism === true,
    data?.setting?.enableBackground === true
  );

  useEffect(() => {
    if (data?.catelogs) restoreTag(data.catelogs);
  }, [data?.catelogs, restoreTag]);

  useEffect(() => {
    if (data?.setting) initServerJumpTargetConfig(data.setting);
  }, [data?.setting]);

  const showGithub = useMemo(
    () => !(data?.setting?.hideGithub === true),
    [data?.setting?.hideGithub]
  );

  const isPexels = useMemo(() => {
    const url = data?.setting?.backgroundUrl?.trim().toLowerCase() ?? "";
    return url === "pexels" || url.startsWith("pexels:");
  }, [data?.setting?.backgroundUrl]);

  const [bgRefreshKey, setBgRefreshKey] = useState(0);
  const handleRefreshBg = useCallback(() => {
    const { query } = parsePexelsUrl(data?.setting?.backgroundUrl ?? "");
    clearPexelsCache(query);
    setBgRefreshKey((k) => k + 1);
  }, [data?.setting?.backgroundUrl]);

  const [theme, setTheme] = useState<"light" | "dark" | "auto">(initTheme());
  useEffect(() => {
    localStorage.setItem("theme", theme);
    applyTheme(decodeTheme(theme), "setTheme", true);
  }, [theme]);
  const handleThemeSwitch = useCallback(() => {
    setTheme((prev) => prev === "light" ? "dark" : prev === "dark" ? "auto" : "light");
  }, []);

  useEffect(() => {
    const el = document.querySelector(".desktop-page") as HTMLElement | null;
    if (!el) return;
    const density = data?.siteConfig?.density || "standard";
    const params: Record<string, { rowHeight: number; iconSize: number; iconGap: number; margin: number }> = {
      compact: { rowHeight: 64, iconSize: 38, iconGap: 4, margin: 8 },
      standard: { rowHeight: 80, iconSize: 48, iconGap: 6, margin: 12 },
      relaxed: { rowHeight: 100, iconSize: 62, iconGap: 8, margin: 16 },
    };
    const p = params[density] || params.standard;
    el.style.setProperty("--icon-size", `${p.iconSize}px`);
    el.style.setProperty("--icon-gap", `${p.iconGap}px`);
    el.style.setProperty("--row-height", `${p.rowHeight}px`);
    el.style.setProperty("--grid-margin", `${p.margin}px`);
    el.style.setProperty("--folder-inner-gap", `${p.iconGap}px`);
  }, [data?.siteConfig?.density]);

  // ResizeObserver: 持续更新 --cell-width / --cell-gap-x / --cell-gap-y 到 .desktop-page
  useEffect(() => {
    const pageEl = document.querySelector(".desktop-page") as HTMLElement | null;
    const workspaceEl = document.querySelector(".desktop-workspace") as HTMLElement | null;
    if (!pageEl || !workspaceEl) return;
    const BP = { lg: 1100, md: 768, sm: 500, xs: 0 };
    const COLS = { lg: 12, md: 8, sm: 5, xs: 3 };
    const getBreakpoint = (w: number) => {
      if (w >= BP.lg) return "lg";
      if (w >= BP.md) return "md";
      if (w >= BP.sm) return "sm";
      return "xs";
    };
    const update = () => {
      const style = getComputedStyle(pageEl);
      const margin = parseFloat(style.getPropertyValue("--grid-margin")) || 12;
      const contentWidth = workspaceEl.clientWidth;
      const bp = getBreakpoint(contentWidth);
      const cols = COLS[bp];
      const cellWidth = cols > 0 ? (contentWidth - (cols - 1) * margin) / cols : 0;
      pageEl.style.setProperty("--cell-width", `${cellWidth}px`);
      pageEl.style.setProperty("--cell-gap-x", `${margin}px`);
      pageEl.style.setProperty("--cell-gap-y", `${margin}px`);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(workspaceEl);
    return () => observer.disconnect();
  }, [data?.siteConfig?.density]);

  const isSearching = searchString.trim() !== "";
  const noImageMode = data?.siteConfig?.noImageMode || false;
  const allTools = data?.tools ?? [];

  const categories = useMemo(() => {
    if (!data?.catelogs) return [];
    return data.catelogs.filter((c: string) => c !== "全部工具");
  }, [data?.catelogs]);

  const gridTools = useMemo(() => {
    const rootTools = allTools.filter((t: Tool) => t.parentId == null);
    if (selectedCategories.size === 0) return rootTools;
    return rootTools.filter((t: Tool) => selectedCategories.has(t.catelog));
  }, [allTools, selectedCategories]);

  const handleToolClick = useCallback(
    (_tool: Tool) => {
      resetSearch();
    },
    [resetSearch]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, tool: Tool) => {
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, tool);
    },
    [openContextMenu]
  );

  const handleViewModeChange = useCallback(
    (tool: Tool, nextMode: "icon" | "card") => {
      updateViewMode.mutate({ id: tool.id, viewMode: nextMode });
    },
    [updateViewMode]
  );

  const isInDock = useCallback(
    (toolId: number) => data?.dockItems?.some((d) => d.toolId === toolId) ?? false,
    [data?.dockItems]
  );

  const handleAddToDock = useCallback(
    (tool: Tool) => {
      addToDock.mutate(tool.id);
    },
    [addToDock]
  );

  const handleMoveToFolderCb = useCallback(
    (toolId: number, folderId: number) => {
      moveToFolder.mutate({ toolId, folderId });
    },
    [moveToFolder]
  );

  const handleMergeToFolderCb = useCallback(
    (toolId1: number, toolId2: number) => {
      const t1 = data?.tools?.find((t) => t.id === toolId1);
      const t2 = data?.tools?.find((t) => t.id === toolId2);
      if (!t1 || !t2) return;
      mergeToFolder.mutate({
        toolId1,
        toolId2,
        catelog: t1.catelog || t2.catelog || "",
      });
    },
    [data?.tools, mergeToFolder]
  );

  return (
    <>
      <Background
        url={data?.setting?.backgroundUrl ?? ""}
        enabled={data?.setting?.enableBackground === true}
        pexelsApiKey={data?.setting?.pexelsApiKey ?? ""}
        refreshKey={bgRefreshKey}
      />
      <Helmet>
        <meta charSet="utf-8" />
        <link rel="icon" href={data?.setting?.favicon ?? "favicon.ico"} />
        <title>{data?.setting?.title ?? "Van Nav"}</title>
      </Helmet>

      <main className="desktop-page">
        <section className="desktop-hero">
          <div className="desktop-hero-inner">
            <TimeDateWidget />
            <div className="desktop-search-shell">
              <SearchBar
                searchString={searchValue}
                setSearchText={(t) => {
                  setSearchValue(t);
                  handleSetSearch(t);
                }}
                onSelectedEngineChange={setSelectedEngine}
              />
            </div>
          </div>
        </section>

        {!isSearching && (
          <CategoryFilter
            categories={categories}
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            onClearFilters={clearFilters}
          />
        )}

        <section className="desktop-workspace">
          <div className="desktop-content-shell">
            {isLoading ? (
              <div className="desktop-loading-shell" key="loading">
                <Loading />
              </div>
            ) : isSearching ? (
              filteredData.length === 0 ? (
                <div className="search-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <div className="search-empty-text">未找到匹配的工具</div>
                  <div className="search-empty-hint">尝试不同的关键词</div>
                </div>
              ) : (
              <div className="desktop-tool-grid desktop-tool-grid-flat">
                {filteredData.map((item, index) => {
                  const parentFolder = item.parentId != null
                    ? allTools.find((t) => t.id === item.parentId)
                    : null;
                  return (
                    <div key={item.id} className="search-result-cell">
                      <ToolItem
                        tool={item}
                        index={index}
                        isSearching={isSearching}
                        noImageMode={noImageMode}
                        onContextMenu={handleContextMenu}
                        onClick={() => handleToolClick(item)}
                      />
                      {parentFolder && (
                        <div className="search-folder-label">位于：{parentFolder.name}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              )
            ) : (
              <WidgetGrid
                tools={gridTools}
                allTools={allTools}
                noImageMode={noImageMode}
                onToolClick={handleToolClick}
                onToolContextMenu={handleContextMenu}
                onMoveToFolder={handleMoveToFolderCb}
                onMergeToFolder={handleMergeToFolderCb}
              />
            )}
          </div>
        </section>

        <DockBar items={data?.dockItems ?? []} onChange={refreshContent} />
      </main>

      <ToolContextMenu
        state={contextMenu}
        onClose={closeContextMenu}
        onViewModeChange={handleViewModeChange}
        onAddToDock={handleAddToDock}
        isInDock={isInDock}
        allTools={allTools}
        onRefresh={refreshContent}
      />

      <div className="record-wraper">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer">
          {data?.setting?.govRecord ?? ""}
        </a>
      </div>
      <FloatingActions
        showGithub={showGithub}
        theme={theme}
        onThemeSwitch={handleThemeSwitch}
        showRefresh={isPexels && !!data?.setting?.enableBackground}
        onRefresh={handleRefreshBg}
      />
    </>
  );
};

export default Content;
