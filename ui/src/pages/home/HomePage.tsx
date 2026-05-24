import { Helmet } from "react-helmet";
import { useCallback, useEffect, useMemo, useState } from "react";
import CategoryFilter from "../../components/CategoryFilter";
import FloatingActions from "../../components/FloatingActions";
import { Loading } from "../../components/Loading";
import MobileCategoryMenu from "../../components/MobileCategoryMenu";
import SearchBar from "../../components/SearchBar";
import SettingsButton from "../../components/SettingsButton";
import TimeDateWidget from "../../components/TimeDateWidget";
import ToolItem from "../../components/ToolItem";
import { ALL_TOOLS_CATEGORY } from "../../entities/tool/model";
import HomeBackground from "../../features/background/HomeBackground";
import ToolMenu from "../../features/context-menu/ToolMenu";
import Dock from "../../features/dock/Dock";
import PanelGrid from "../../features/panel-grid/PanelGrid";
import {
  useAddToDock,
  useContentQuery,
  useMergeToFolder,
  useMoveToFolder,
  useRefreshContent,
  useUpdateViewMode,
} from "../../queries";
import { useUIStore } from "../../stores/ui";
import type { SearchEngine, Tool } from "../../types";
import { initServerJumpTargetConfig } from "../../utils/setting";
import { useBackgroundEffect, useKeyboardNavigation, useSearch } from "./hooks";
import "./home-page.css";
import { useHomeBackground } from "./useHomeBackground";
import { useHomeLayoutVars } from "./useHomeLayoutVars";
import { useHomeTheme } from "./useHomeTheme";

export default function HomePage() {
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

  const { searchString, filteredData, handleSetSearch, resetSearch, restoreTag } = useSearch(
    data ?? null
  );
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine | null>(null);

  useKeyboardNavigation(searchString, filteredData, resetSearch, selectedEngine);
  useBackgroundEffect(
    data?.setting?.enableSurfaceEffects === true,
    data?.setting?.enableBackground === true
  );

  const { theme, handleThemeSwitch } = useHomeTheme();
  useHomeLayoutVars(data?.siteConfig?.density);
  const { bgRefreshKey, handleRefreshBg, showRefresh } = useHomeBackground(
    data?.setting?.backgroundUrl,
    data?.setting?.enableBackground
  );

  useEffect(() => {
    if (data?.categories) restoreTag(data.categories);
  }, [data?.categories, restoreTag]);

  useEffect(() => {
    if (data?.setting) initServerJumpTargetConfig(data.setting);
  }, [data?.setting]);

  const showGithub = useMemo(
    () => !(data?.setting?.hideGithub === true),
    [data?.setting?.hideGithub]
  );

  const isSearching = searchString.trim() !== "";
  const noImageMode = data?.siteConfig?.noImageMode || false;
  const allTools = data?.tools ?? [];

  const categories = useMemo(
    () => (data?.categories ?? []).filter((category) => category !== ALL_TOOLS_CATEGORY),
    [data?.categories]
  );

  const gridTools = useMemo(() => {
    const rootTools = allTools.filter((tool) => tool.parentId == null);
    if (selectedCategories.size === 0) return rootTools;
    return rootTools.filter((tool) => selectedCategories.has(tool.category));
  }, [allTools, selectedCategories]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, tool: Tool) => {
      event.preventDefault();
      openContextMenu(event.clientX, event.clientY, tool);
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
    (toolId: number) => data?.dockItems?.some((item) => item.toolId === toolId) ?? false,
    [data?.dockItems]
  );

  const handleMoveOutOfFolderCb = useCallback(
    (toolId: number) => {
      moveToFolder.mutate({ toolId, folderId: null });
    },
    [moveToFolder]
  );

  return (
    <>
      <HomeBackground setting={data?.setting} refreshKey={bgRefreshKey} />
      <Helmet>
        <meta charSet="utf-8" />
        <link rel="icon" href={data?.setting?.favicon ?? "favicon.ico"} />
        <title>{data?.setting?.title ?? "4th Nav"}</title>
      </Helmet>

      <main className="desktop-page">
        <section className="desktop-hero">
          <div className="desktop-hero-inner">
            <TimeDateWidget />
            <div className="desktop-search-shell">
              <SearchBar
                searchString={searchValue}
                setSearchText={(value) => {
                  setSearchValue(value);
                  handleSetSearch(value);
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
        {!isSearching && (
          <MobileCategoryMenu
            categories={categories}
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            onClearFilters={clearFilters}
          />
        )}
        <SettingsButton />

        <section className="desktop-workspace">
          <div className="desktop-content-shell">
            {isLoading ? (
              <div className="desktop-loading-shell" key="loading">
                <Loading />
              </div>
            ) : isSearching ? (
              filteredData.length === 0 ? (
                <div className="search-empty-state">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: 0.3 }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <div className="search-empty-text">未找到匹配的工具</div>
                  <div className="search-empty-hint">试试别的关键词</div>
                </div>
              ) : (
                <div className="desktop-tool-grid desktop-tool-grid-flat">
                  {filteredData.map((item, index) => {
                    const parentFolder =
                      item.parentId != null
                        ? allTools.find((tool) => tool.id === item.parentId)
                        : null;
                    return (
                      <div key={item.id} className="search-result-cell">
                        <ToolItem
                          tool={item}
                          index={index}
                          isSearching={isSearching}
                          noImageMode={noImageMode}
                          onContextMenu={handleContextMenu}
                          onClick={() => resetSearch()}
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
              <PanelGrid
                tools={gridTools}
                allTools={allTools}
                noImageMode={noImageMode}
                listItemSize={data?.siteConfig?.folderListItemSize ?? 28}
                onToolClick={() => resetSearch()}
                onToolContextMenu={handleContextMenu}
                onMoveToFolder={(toolId, folderId) => moveToFolder.mutate({ toolId, folderId })}
                onMoveOutOfFolder={handleMoveOutOfFolderCb}
                onMergeToFolder={(toolId1, toolId2, pos1, pos2) => {
                  const firstTool = data?.tools?.find((tool) => tool.id === toolId1);
                  const secondTool = data?.tools?.find((tool) => tool.id === toolId2);
                  if (!firstTool || !secondTool) return;
                  const earlier =
                    pos1.y < pos2.y || (pos1.y === pos2.y && pos1.x < pos2.x) ? pos1 : pos2;
                  mergeToFolder.mutate({
                    toolId1,
                    toolId2,
                    category: firstTool.category || secondTool.category || "",
                    gridX: earlier.x,
                    gridY: earlier.y,
                  });
                }}
              />
            )}
          </div>
        </section>

        <Dock items={data?.dockItems ?? []} onChange={refreshContent} />
      </main>

      <ToolMenu
        state={contextMenu}
        onClose={closeContextMenu}
        onViewModeChange={handleViewModeChange}
        onAddToDock={(tool) => addToDock.mutate(tool.id)}
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
        showRefresh={showRefresh}
        onRefresh={handleRefreshBg}
      />
    </>
  );
}
