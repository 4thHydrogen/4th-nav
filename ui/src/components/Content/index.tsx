import "./index.css";
import SearchBar from "../SearchBar";
import { Loading } from "../Loading";
import { Helmet } from "react-helmet";
import { useCallback, useEffect, useMemo, useState } from "react";
import GithubLink from "../GithubLink";
import DarkSwitch from "../DarkSwitch";
import { toggleJumpTarget } from "../../utils/setting";
import Background from "../Background";
import LeftCategoryNav from "../LeftCategoryNav";
import DesktopCategorySection from "../DesktopCategorySection";
import ToolContextMenu from "../ToolContextMenu";
import ToolItem from "../ToolItem";
import TimeDateWidget from "../TimeDateWidget";
import type { Tool, ToolViewMode } from "../../types";
import { fetchUpdateToolViewMode } from "../../utils/api";
import {
  useContentData,
  useSearch,
  useCategoryObserver,
  useKeyboardNavigation,
  useBackgroundEffect,
} from "./hooks";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tool: Tool | null;
}

const Content = () => {
  const { data, loading, loadData, setData } = useContentData();
  const {
    val,
    searchString,
    filteredData,
    groupedData,
    handleSetSearch,
    resetSearch,
    restoreTag,
    setVal,
  } = useSearch(data);

  useKeyboardNavigation(searchString, filteredData, resetSearch);
  useBackgroundEffect(
    data?.setting?.enableGlassmorphism === true,
    data?.setting?.enableBackground === true
  );
  const { visibleCategory, scrollToCategory } = useCategoryObserver(groupedData);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    tool: null,
  });

  useEffect(() => {
    loadData().then((r) => {
      if (r?.catelogs) restoreTag(r.catelogs);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showGithub = useMemo(() => {
    return !(data?.setting?.hideGithub === true);
  }, [data]);

  const isGroupedMode = groupedData !== null && Object.keys(groupedData).length > 0;
  const isSearching = searchString.trim() !== "";
  const noImageMode = data?.siteConfig?.noImageMode || false;

  const handleToolClick = useCallback(
    (tool: Tool) => {
      resetSearch();
      if (tool.url === "toggleJumpTarget") {
        toggleJumpTarget();
        loadData();
      }
    },
    [resetSearch, loadData]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent, tool: Tool) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tool,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleViewModeChange = useCallback(
    async (tool: Tool, nextMode: ToolViewMode) => {
      const prevMode = tool.viewMode;
      setData((prev) =>
        prev
          ? {
              ...prev,
              tools: prev.tools.map((t) =>
                t.id === tool.id ? { ...t, viewMode: nextMode } : t
              ),
            }
          : prev
      );
      try {
        await fetchUpdateToolViewMode(tool.id, nextMode);
      } catch {
        setData((prev) =>
          prev
            ? {
                ...prev,
                tools: prev.tools.map((t) =>
                  t.id === tool.id ? { ...t, viewMode: prevMode } : t
                ),
              }
            : prev
        );
      }
    },
    [setData]
  );

  return (
    <>
      <Background
        url={data?.setting?.backgroundUrl ?? ""}
        enabled={data?.setting?.enableBackground === true}
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
                searchString={val}
                setSearchText={(t) => {
                  setVal(t);
                  handleSetSearch(t);
                }}
              />
            </div>
          </div>
        </section>

        <section className={`desktop-workspace ${isGroupedMode && !isSearching ? "" : "desktop-workspace-flat"}`}>
          {isGroupedMode && !isSearching && (
            <LeftCategoryNav
              categories={Object.keys(groupedData)}
              activeCategory={visibleCategory}
              onNavigate={scrollToCategory}
            />
          )}

          <div className="desktop-content-shell">
            {loading ? (
              <div className="desktop-loading-shell" key="loading">
                <Loading />
              </div>
            ) : isGroupedMode && !isSearching ? (
              Object.entries(groupedData).map(([category, items]) => (
                <DesktopCategorySection
                  key={category}
                  category={category}
                  items={items}
                  isSearching={false}
                  noImageMode={noImageMode}
                  onToolContextMenu={handleContextMenu}
                  onToolClick={handleToolClick}
                />
              ))
            ) : (
              <div className="desktop-tool-grid desktop-tool-grid-flat">
                {filteredData.map((item, index) => (
                  <ToolItem
                    key={item.id}
                    tool={item}
                    index={index}
                    isSearching={isSearching}
                    noImageMode={noImageMode}
                    onContextMenu={handleContextMenu}
                    onClick={() => handleToolClick(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <ToolContextMenu
        state={contextMenu}
        onClose={closeContextMenu}
        onViewModeChange={handleViewModeChange}
      />

      <div className="record-wraper">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer">
          {data?.setting?.govRecord ?? ""}
        </a>
      </div>
      {showGithub && <GithubLink />}
      <DarkSwitch showGithub={showGithub} />
    </>
  );
};

export default Content;
