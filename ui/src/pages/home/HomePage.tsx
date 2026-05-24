import { Helmet } from "react-helmet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ALL_TOOLS_CATEGORY } from "../../entities/tool/model";
import HomeBackground from "../../features/background/HomeBackground";
import ToolMenu from "../../features/context-menu/ToolMenu";
import Dock from "../../features/dock/Dock";
import FloatingActions from "../../features/home-layout/FloatingActions";
import { HomeHero } from "../../features/home-layout/HomeHero";
import { HomeWorkspace } from "../../features/home-layout/HomeWorkspace";
import SettingsButton from "../../features/settings/SettingsButton";
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

  const { searchString, filteredData, handleSetSearch, resetSearch, restoreTag } =
    useSearch(data ?? null);
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
    if (data?.categories) {
      restoreTag(data.categories);
    }
  }, [data?.categories, restoreTag]);

  useEffect(() => {
    if (data?.setting) {
      initServerJumpTargetConfig(data.setting);
    }
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
    if (selectedCategories.size === 0) {
      return rootTools;
    }
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

  const handleMoveOutOfFolder = useCallback(
    (toolId: number) => {
      moveToFolder.mutate({ toolId, folderId: null });
    },
    [moveToFolder]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      handleSetSearch(value);
    },
    [handleSetSearch, setSearchValue]
  );

  const handleMergeToFolder = useCallback(
    (
      toolId1: number,
      toolId2: number,
      pos1: { x: number; y: number },
      pos2: { x: number; y: number }
    ) => {
      const firstTool = data?.tools?.find((tool) => tool.id === toolId1);
      const secondTool = data?.tools?.find((tool) => tool.id === toolId2);
      if (!firstTool || !secondTool) {
        return;
      }

      const earlier =
        pos1.y < pos2.y || (pos1.y === pos2.y && pos1.x < pos2.x) ? pos1 : pos2;

      mergeToFolder.mutate({
        toolId1,
        toolId2,
        category: firstTool.category || secondTool.category || "",
        gridX: earlier.x,
        gridY: earlier.y,
      });
    },
    [data?.tools, mergeToFolder]
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
        <HomeHero
          searchValue={searchValue}
          onSearchValueChange={handleSearchChange}
          onSelectedEngineChange={setSelectedEngine}
        />

        <SettingsButton />

        <HomeWorkspace
          isLoading={isLoading}
          isSearching={isSearching}
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onClearFilters={clearFilters}
          filteredData={filteredData}
          allTools={allTools}
          gridTools={gridTools}
          noImageMode={noImageMode}
          listItemSize={data?.siteConfig?.folderListItemSize ?? 28}
          onContextMenu={handleContextMenu}
          onResetSearch={() => resetSearch()}
          onMoveToFolder={(toolId, folderId) =>
            moveToFolder.mutate({ toolId, folderId })
          }
          onMoveOutOfFolder={handleMoveOutOfFolder}
          onMergeToFolder={handleMergeToFolder}
        />

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
