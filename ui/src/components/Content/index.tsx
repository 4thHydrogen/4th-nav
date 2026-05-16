import "./index.css";
import CardV2 from "../CardV2";
import SearchBar from "../SearchBar";
import { Loading } from "../Loading";
import { Helmet } from "react-helmet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FetchList } from "../../utils/api";
import TagSelector from "../TagSelector";
import pinyin from "pinyin-match";
import GithubLink from "../GithubLink";
import DarkSwitch from "../DarkSwitch";
import { isLogin } from "../../utils/check";
import { generateSearchEngineCard } from "../../utils/serachEngine";
import { toggleJumpTarget } from "../../utils/setting";
import Background from "../Background";
import CategoryNav from "../CategoryNav";

const mutiSearch = (s, t) => {
  const source = (s as string).toLowerCase();
  const target = t.toLowerCase();
  const rawInclude = source.includes(target);
  const pinYinInlcude = Boolean(pinyin.match(source, target));
  return rawInclude || pinYinInlcude;
};

const Content = (props: any) => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [currTag, setCurrTag] = useState("全部工具");
  const [searchString, setSearchString] = useState("");
  const [val, setVal] = useState("");
  const [searchEngineCards, setSearchEngineCards] = useState<any[]>([]);
  const [visibleCategory, setVisibleCategory] = useState<string>("");

  const filteredDataRef = useRef<any>([]);

  const showGithub = useMemo(() => {
    const hide = data?.setting?.hideGithub === true
    return !hide;
  }, [data])

  const enableGlassmorphism = useMemo(() => {
    return data?.setting?.enableGlassmorphism === true;
  }, [data?.setting?.enableGlassmorphism]);

  useEffect(() => {
    const body = document.querySelector("body");
    if (!body) return;
    body.classList.toggle("glassmorphism", enableGlassmorphism);
    return () => {
      body.classList.remove("glassmorphism");
    };
  }, [enableGlassmorphism]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const r = await FetchList();
      setData(r);
      const tagInLocalStorage = window.localStorage.getItem("tag");
      if (tagInLocalStorage && tagInLocalStorage !== "") {
        if (r?.catelogs && r?.catelogs.includes(tagInLocalStorage)) {
          setCurrTag(tagInLocalStorage);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setCurrTag]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 异步加载搜索引擎卡片
  useEffect(() => {
    const loadSearchEngineCards = async () => {
      try {
        const cards = await generateSearchEngineCard(searchString);
        setSearchEngineCards(cards);
      } catch (error) {
        setSearchEngineCards([]);
      }
    };

    loadSearchEngineCards();
  }, [searchString]);

  const handleMiddleClickTag = useCallback((tag: string) => {
    if (!data.tools) return;
    data.tools
      .filter((item: any) => {
        if (item.url === "admin" || item.url === "toggleJumpTarget") return false;
        if (tag === "全部工具") return true;
        return item.catelog === tag;
      })
      .forEach((item: any) => {
        window.open(item.url, "_blank");
      });
  }, [data.tools]);

  const handleSetCurrTag = (tag: string) => {
    setCurrTag(tag);
    // 管理后台不记录了
    if (tag !== "管理后台") {
      window.localStorage.setItem("tag", tag);
    }
    resetSearch(true);
  };

  const resetSearch = (notSetTag?: boolean) => {
    setVal("");
    setSearchString("");
    const tagInLocalStorage = window.localStorage.getItem("tag");
    if (!notSetTag && tagInLocalStorage && tagInLocalStorage !== "" && tagInLocalStorage !== "管理后台") {
      setCurrTag(tagInLocalStorage);
    }
  };

  const handleSetSearch = (val: string) => {
    if (val !== "" && val) {
      setCurrTag("全部工具");
      setSearchString(val.trim());
    } else {
      resetSearch();
    }
  }

  const filteredData = useMemo(() => {
    if (data.tools) {
      const localResult = data.tools
        .filter((item: any) => {
          if (currTag === "全部工具") {
            return true;
          }
          return item.catelog === currTag;
        })
        .filter((item: any) => {
          if (searchString === "") {
            return true;
          }
          return (
            mutiSearch(item.name, searchString) ||
            mutiSearch(item.desc, searchString) ||
            mutiSearch(item.url, searchString)
          );
        });
      return [...localResult, ...searchEngineCards]
    } else {
      return [...searchEngineCards];
    }
  }, [data, currTag, searchString, searchEngineCards]);

  // 分组数据：仅当"全部工具"且无搜索时按分类分组
  const groupedData = useMemo(() => {
    if (currTag !== "全部工具" || searchString.trim() !== "") return null;
    const groups: Record<string, any[]> = {};
    const categoryOrder = data?.catelogs ?? [];
    filteredData.forEach(item => {
      const cat = item.catelog || "未分类";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    // 按分类顺序排序
    const ordered: Record<string, any[]> = {};
    categoryOrder.forEach((cat: string) => {
      if (cat === "全部工具") return;
      if (groups[cat]) {
        ordered[cat] = groups[cat];
      }
    });
    // 添加不在分类列表中的分组
    Object.keys(groups).forEach(cat => {
      if (!ordered[cat]) {
        ordered[cat] = groups[cat];
      }
    });
    return ordered;
  }, [currTag, searchString, filteredData, data?.catelogs]);

  useEffect(() => {
    filteredDataRef.current = filteredData
  }, [filteredData])

  // IntersectionObserver 追踪当前可见分类
  useEffect(() => {
    if (!groupedData) {
      setVisibleCategory("");
      return;
    }
    const categories = Object.keys(groupedData);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const cat = entry.target.id.replace("category-", "");
            setVisibleCategory(cat);
          }
        });
      },
      { threshold: 0.1, rootMargin: "-80px 0px -50% 0px", root: document.querySelector(".content-wraper") }
    );
    categories.forEach(cat => {
      const el = document.getElementById(`category-${cat}`);
      if (el) observer.observe(el);
    });
    // 默认设置第一个分类为可见
    if (categories.length > 0) {
      setVisibleCategory(categories[0]);
    }
    return () => observer.disconnect();
  }, [groupedData]);

  const scrollToCategory = useCallback((category: string) => {
    const el = document.getElementById(`category-${category}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (searchString.trim() === "") {
      document.removeEventListener("keydown", onKeyEnter);
    } else {
      document.addEventListener("keydown", onKeyEnter);
    }
    return () => {
      document.removeEventListener("keydown", onKeyEnter);
    }
    // eslint-disable-next-line
  }, [searchString])

  const cardProps = (item: any, index: number) => ({
    title: item.name,
    url: item.url,
    des: item.desc,
    logo: item.logo,
    key: item.id,
    catelog: item.catelog,
    index: index,
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
  });

  const renderCardsV2 = useCallback(() => {
    return filteredData.map((item, index) => {
      return <CardV2 {...cardProps(item, index)} />;
    });
    // eslint-disable-next-line
  }, [filteredData, searchString, data?.siteConfig?.noImageMode, data?.siteConfig?.compactMode]);

  const onKeyEnter = (ev: KeyboardEvent) => {
    const cards = filteredDataRef.current;
    // 使用 keyCode 防止与中文输入冲突
    if (ev.keyCode === 13) {
      if (cards && cards.length) {
        window.open(cards[0]?.url, "_blank");
        resetSearch();
      }
    }
    // 如果按了数字键 + ctrl/meta，打开对应的卡片
    if (ev.ctrlKey || ev.metaKey) {
      const num = Number(ev.key);
      if (isNaN(num)) return;
      ev.preventDefault()
      const index = Number(ev.key) - 1;
      if (index >= 0 && index < cards.length) {
        window.open(cards[index]?.url, "_blank");
        resetSearch();
      }
    }
  };

  const isGroupedMode = groupedData !== null && Object.keys(groupedData).length > 0;

  return (
    <>
      <Background
        url={data?.setting?.backgroundUrl ?? ""}
        enabled={data?.setting?.enableBackground === true}
      />
      <Helmet>
        <meta charSet="utf-8" />
        <link
          rel="icon"
          href={
            data?.setting?.favicon ?? "favicon.ico"
          }
        />
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
            <Loading></Loading>
          </div>
        ) : isGroupedMode ? (
          <div
            className="content grouped-content"
            key={currTag}
            style={{ '--grid-columns': data?.siteConfig?.columnsPerRow || 3 } as React.CSSProperties}
          >
            {Object.entries(groupedData).flatMap(([category, items]) => [
              <div
                key={`header-${category}`}
                id={`category-${category}`}
                className="category-group-header"
              >
                {category}
              </div>,
              ...items.map((item: any, index: number) => (
                <CardV2 {...cardProps(item, index)} />
              ))
            ])}
          </div>
        ) : (
          <div
            className={`content cards ${data?.siteConfig?.compactMode ? 'compact-grid' : ''}`}
            key={currTag}
            style={{ '--grid-columns': data?.siteConfig?.columnsPerRow || 3 } as React.CSSProperties}
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
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer">{data?.setting?.govRecord ?? ""}</a>
      </div>
      {showGithub && <GithubLink />}
      <DarkSwitch showGithub={showGithub} />
    </>
  );
};

export default Content;
