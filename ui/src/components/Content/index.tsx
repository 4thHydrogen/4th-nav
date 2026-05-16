import "./index.css";
import CardV2 from "../CardV2";
import SearchBar from "../SearchBar";
import { Loading } from "../Loading";
import { Helmet } from "react-helmet";
import { useCallback, useEffect, useMemo } from "react";
import TagSelector from "../TagSelector";
import GithubLink from "../GithubLink";
import DarkSwitch from "../DarkSwitch";
import { toggleJumpTarget } from "../../utils/setting";
import Background from "../Background";
import CategoryNav from "../CategoryNav";
import type { Tool, CardProps as CardPropsType } from "../../types";
import {
  useContentData,
  useSearch,
  useCategoryObserver,
  useKeyboardNavigation,
  useBackgroundEffect,
} from "./hooks";

const Content = () => {
  const { data, loading, loadData } = useContentData();
  const {
    currTag,
    val,
    searchString,
    filteredData,
    groupedData,
    handleSetCurrTag,
    handleSetSearch,
    handleMiddleClickTag,
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

  const cardProps = useCallback(
    (item: Tool, index: number): CardPropsType => ({
      title: item.name,
      url: item.url,
      des: item.desc,
      logo: item.logo,
      catelog: item.catelog,
      index,
      isSearching: searchString.trim() !== "",
      noImageMode: data?.siteConfig?.noImageMode || false,
      compactMode: data?.siteConfig?.compactMode || false,
      onClick: () => {
        resetSearch();
        if (item.url === "toggleJumpTarget") {
          toggleJumpTarget();
          loadData();
        }
      },
    }),
    [searchString, data?.siteConfig?.noImageMode, data?.siteConfig?.compactMode, resetSearch, loadData]
  );

  const renderCardsV2 = useCallback(() => {
    return filteredData.map((item, index) => (
      <CardV2 key={item.id} {...cardProps(item, index)} />
    ));
  }, [filteredData, cardProps]);

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
      <div className="topbar">
        <div className="content">
          <SearchBar
            searchString={val}
            setSearchText={(t) => {
              setVal(t);
              handleSetSearch(t);
            }}
          />
          <TagSelector
            tags={data?.catelogs ?? ["全部工具"]}
            currTag={currTag}
            onTagChange={handleSetCurrTag}
            onMiddleClick={handleMiddleClickTag}
          />
        </div>
      </div>
      <div className="content-wraper">
        {loading ? (
          <div className="content cards" key="loading">
            <Loading />
          </div>
        ) : isGroupedMode ? (
          <div
            className="content grouped-content"
            key={currTag}
            style={{ "--grid-columns": data?.siteConfig?.columnsPerRow || 3 } as React.CSSProperties}
          >
            {Object.entries(groupedData).flatMap(([category, items]) => [
              <div
                key={`header-${category}`}
                id={`category-${category}`}
                className="category-group-header"
              >
                {category}
              </div>,
              ...items.map((item: Tool, index: number) => (
                <CardV2 key={item.id} {...cardProps(item, index)} />
              )),
            ])}
          </div>
        ) : (
          <div
            className={`content cards ${data?.siteConfig?.compactMode ? "compact-grid" : ""}`}
            key={currTag}
            style={{ "--grid-columns": data?.siteConfig?.columnsPerRow || 3 } as React.CSSProperties}
          >
            {renderCardsV2()}
          </div>
        )}
      </div>
      {isGroupedMode && (
        <CategoryNav
          categories={Object.keys(groupedData!)}
          activeCategory={visibleCategory}
          onNavigate={scrollToCategory}
        />
      )}
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
