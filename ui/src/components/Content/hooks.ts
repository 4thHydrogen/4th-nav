import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FetchList } from "../../utils/api";
import { mutiSearch } from "../../utils/admin";
import { generateSearchEngineCard } from "../../utils/serachEngine";
import type { ContentData, Tool } from "../../types";

export function useContentData() {
  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (): Promise<ContentData | null> => {
    try {
      setLoading(true);
      const r = await FetchList();
      setData(r);
      return r;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, loadData, setData };
}

export function useSearch(data: ContentData | null) {
  const [currTag, setCurrTag] = useState("全部工具");
  const [searchString, setSearchString] = useState("");
  const [val, setVal] = useState("");
  const [searchEngineCards, setSearchEngineCards] = useState<Tool[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const cards = await generateSearchEngineCard(searchString);
        setSearchEngineCards(cards);
      } catch {
        setSearchEngineCards([]);
      }
    };
    load();
  }, [searchString]);

  const resetSearch = useCallback((notSetTag?: boolean) => {
    setVal("");
    setSearchString("");
    const tagInLocalStorage = window.localStorage.getItem("tag");
    if (!notSetTag && tagInLocalStorage && tagInLocalStorage !== "" && tagInLocalStorage !== "管理后台") {
      setCurrTag(tagInLocalStorage);
    }
  }, []);

  const handleSetCurrTag = useCallback((tag: string) => {
    setCurrTag(tag);
    if (tag !== "管理后台") {
      window.localStorage.setItem("tag", tag);
    }
    resetSearch(true);
  }, [resetSearch]);

  const handleSetSearch = useCallback((v: string) => {
    if (v !== "" && v) {
      setCurrTag("全部工具");
      setSearchString(v.trim());
    } else {
      resetSearch();
    }
  }, [resetSearch]);

  const handleMiddleClickTag = useCallback((tag: string) => {
    if (!data?.tools) return;
    data.tools
      .filter((item: Tool) => {
        if (item.url === "admin" || item.url === "toggleJumpTarget") return false;
        return tag === "全部工具" || item.catelog === tag;
      })
      .forEach((item: Tool) => {
        window.open(item.url, "_blank");
      });
  }, [data?.tools]);

  const filteredData = useMemo(() => {
    if (data?.tools) {
      const localResult = data.tools
        .filter((item: Tool) => currTag === "全部工具" || item.catelog === currTag)
        .filter((item: Tool) => {
          if (searchString === "") return true;
          return (
            mutiSearch(item.name, searchString) ||
            mutiSearch(item.desc, searchString) ||
            mutiSearch(item.url, searchString)
          );
        });
      return [...localResult, ...searchEngineCards];
    }
    return [...searchEngineCards];
  }, [data, currTag, searchString, searchEngineCards]);

  const groupedData = useMemo(() => {
    if (currTag !== "全部工具" || searchString.trim() !== "") return null;
    const groups: Record<string, Tool[]> = {};
    const categoryOrder = data?.catelogs ?? [];
    filteredData.forEach(item => {
      const cat = item.catelog || "未分类";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    const ordered: Record<string, Tool[]> = {};
    categoryOrder.forEach((cat: string) => {
      if (cat === "全部工具") return;
      if (groups[cat]) ordered[cat] = groups[cat];
    });
    Object.keys(groups).forEach(cat => {
      if (!ordered[cat]) ordered[cat] = groups[cat];
    });
    return ordered;
  }, [currTag, searchString, filteredData, data?.catelogs]);

  const restoreTag = useCallback((catelogs: string[]) => {
    const tagInLocalStorage = window.localStorage.getItem("tag");
    if (tagInLocalStorage && tagInLocalStorage !== "" && catelogs.includes(tagInLocalStorage)) {
      setCurrTag(tagInLocalStorage);
    }
  }, []);

  return {
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
  };
}

export function useCategoryObserver(groupedData: Record<string, Tool[]> | null) {
  const [visibleCategory, setVisibleCategory] = useState<string>("");

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
    if (categories.length > 0) {
      setVisibleCategory(categories[0]);
    }
    return () => observer.disconnect();
  }, [groupedData]);

  const scrollToCategory = useCallback((category: string) => {
    const el = document.getElementById(`category-${category}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return { visibleCategory, scrollToCategory };
}

export function useKeyboardNavigation(
  searchString: string,
  filteredData: Tool[],
  resetSearch: (notSetTag?: boolean) => void
) {
  const filteredDataRef = useRef<Tool[]>([]);

  useEffect(() => {
    filteredDataRef.current = filteredData;
  }, [filteredData]);

  const onKeyEnter = useCallback((ev: KeyboardEvent) => {
    const cards = filteredDataRef.current;
    if (ev.keyCode === 13) {
      if (cards && cards.length) {
        window.open(cards[0]?.url, "_blank");
        resetSearch();
      }
    }
    if (ev.ctrlKey || ev.metaKey) {
      const num = Number(ev.key);
      if (isNaN(num)) return;
      ev.preventDefault();
      const index = Number(ev.key) - 1;
      if (index >= 0 && index < cards.length) {
        window.open(cards[index]?.url, "_blank");
        resetSearch();
      }
    }
  }, [resetSearch]);

  useEffect(() => {
    if (searchString.trim() === "") {
      document.removeEventListener("keydown", onKeyEnter);
    } else {
      document.addEventListener("keydown", onKeyEnter);
    }
    return () => {
      document.removeEventListener("keydown", onKeyEnter);
    };
  }, [searchString, onKeyEnter]);
}

export function useBackgroundEffect(enableGlassmorphism: boolean, enableBackground: boolean) {
  useEffect(() => {
    if (localStorage.getItem("nav-bg") === "1") {
      document.body.classList.add("has-background");
    }
  }, []);

  useEffect(() => {
    const body = document.querySelector("body");
    if (!body) return;
    body.classList.toggle("glassmorphism", enableGlassmorphism);
    body.classList.toggle("has-background", enableBackground);
    localStorage.setItem("nav-bg", enableBackground ? "1" : "0");
    return () => {
      body.classList.remove("glassmorphism");
      body.classList.remove("has-background");
    };
  }, [enableGlassmorphism, enableBackground]);
}
