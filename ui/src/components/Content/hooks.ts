import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mutiSearch } from "../../utils/admin";
import { generateSearchUrl } from "../../utils/searchEngine";
import type { ContentData, SearchEngine, Tool } from "../../types";

export function useSearch(data: ContentData | null) {
  const [currTag, setCurrTag] = useState("全部工具");
  const [searchString, setSearchString] = useState("");

  const resetSearch = useCallback((notSetTag?: boolean) => {
    setSearchString("");
    if (!notSetTag) {
      const tagInLocalStorage = window.localStorage.getItem("tag");
      if (tagInLocalStorage && tagInLocalStorage !== "" && tagInLocalStorage !== "管理后台") {
        setCurrTag(tagInLocalStorage);
      }
    }
  }, []);

  const handleSetSearch = useCallback((v: string) => {
    if (v !== "" && v) {
      setCurrTag("全部工具");
      setSearchString(v.trim());
    } else {
      resetSearch();
    }
  }, [resetSearch]);

  const filteredData = useMemo(() => {
    if (data?.tools) {
      return data.tools
        .filter((item: Tool) => currTag === "全部工具" || item.catelog === currTag)
        .filter((item: Tool) => {
          if (searchString === "") return true;
          return (
            mutiSearch(item.name, searchString) ||
            mutiSearch(item.desc, searchString) ||
            mutiSearch(item.url, searchString)
          );
        });
    }
    return [];
  }, [data, currTag, searchString]);

  const restoreTag = useCallback((catelogs: string[]) => {
    const tagInLocalStorage = window.localStorage.getItem("tag");
    if (tagInLocalStorage && tagInLocalStorage !== "" && catelogs.includes(tagInLocalStorage)) {
      setCurrTag(tagInLocalStorage);
    }
  }, []);

  return {
    searchString,
    filteredData,
    handleSetSearch,
    resetSearch,
    restoreTag,
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
      { threshold: 0.1, rootMargin: "-80px 0px -50% 0px", root: document.querySelector(".desktop-content-shell") }
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
  resetSearch: (notSetTag?: boolean) => void,
  selectedEngine: SearchEngine | null
) {
  const filteredDataRef = useRef<Tool[]>([]);

  useEffect(() => {
    filteredDataRef.current = filteredData;
  }, [filteredData]);

  const onKeyEnter = useCallback((ev: KeyboardEvent) => {
    if (ev.key === "Enter") {
      if (!searchString.trim()) return;
      if (selectedEngine) {
        const url = generateSearchUrl(
          selectedEngine.baseUrl,
          selectedEngine.queryParam,
          searchString
        );
        window.open(url, "_blank");
        resetSearch();
      }
    }
    if (ev.ctrlKey || ev.metaKey) {
      const cards = filteredDataRef.current;
      const num = Number(ev.key);
      if (isNaN(num)) return;
      ev.preventDefault();
      const index = Number(ev.key) - 1;
      if (index >= 0 && index < cards.length) {
        window.open(cards[index]?.url, "_blank");
        resetSearch();
      }
    }
  }, [resetSearch, selectedEngine, searchString]);

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
