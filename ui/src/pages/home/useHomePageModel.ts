import { useEffect, useMemo, useState } from "react";
import { ALL_TOOLS_CATEGORY } from "../../entities/tool/model";
import {
  useAddToDock,
  useContentQuery,
  useMergeToFolder,
  useMoveToFolder,
  useRefreshContent,
  useUpdateViewMode,
} from "../../queries";
import { useUIStore } from "../../stores/ui";
import type { SearchEngine } from "../../types";
import { initServerJumpTargetConfig } from "../../utils/setting";
import { useBackgroundEffect, useKeyboardNavigation, useSearch } from "./hooks";
import { useHomeBackground } from "./useHomeBackground";
import { useHomeLayoutVars } from "./useHomeLayoutVars";
import { useHomeTheme } from "./useHomeTheme";

export function useHomePageModel() {
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
  const layoutConfig = useHomeLayoutVars(data?.siteConfig);

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

  return {
    // Query data
    data,
    isLoading,

    // Mutations
    refreshContent,
    updateViewMode,
    addToDock,
    moveToFolder,
    mergeToFolder,

    // UI store
    contextMenu,
    openContextMenu,
    closeContextMenu,
    selectedCategories,
    toggleCategory,
    clearFilters,
    searchValue,
    setSearchValue,

    // Search
    searchString,
    filteredData,
    handleSetSearch,
    resetSearch,
    selectedEngine,
    setSelectedEngine,

    // Layout
    layoutConfig,

    // Theme
    theme,
    handleThemeSwitch,

    // Background
    bgRefreshKey,
    handleRefreshBg,
    showRefresh,

    // Derived data
    showGithub,
    isSearching,
    noImageMode,
    allTools,
    categories,
    gridTools,
  };
}
