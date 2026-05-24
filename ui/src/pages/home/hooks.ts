import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_TOOLS_CATEGORY } from "../../entities/tool/model";
import type { ContentData, SearchEngine, Tool } from "../../types";
import { mutiSearch } from "../../utils/admin";
import { generateSearchUrl } from "../../utils/searchEngine";

const ADMIN_TAG = "管理后台";

export function useSearch(data: ContentData | null) {
  const [currTag, setCurrTag] = useState(ALL_TOOLS_CATEGORY);
  const [searchString, setSearchString] = useState("");

  const resetSearch = useCallback((notSetTag?: boolean) => {
    setSearchString("");
    if (!notSetTag) {
      const tagInLocalStorage = window.localStorage.getItem("tag");
      if (tagInLocalStorage && tagInLocalStorage !== "" && tagInLocalStorage !== ADMIN_TAG) {
        setCurrTag(tagInLocalStorage);
      }
    }
  }, []);

  const handleSetSearch = useCallback(
    (value: string) => {
      if (value !== "" && value) {
        setCurrTag(ALL_TOOLS_CATEGORY);
        setSearchString(value.trim());
      } else {
        resetSearch();
      }
    },
    [resetSearch]
  );

  const filteredData = useMemo(() => {
    if (!data?.tools) return [];
    return data.tools
      .filter((item: Tool) => currTag === ALL_TOOLS_CATEGORY || item.category === currTag)
      .filter((item: Tool) => {
        if (searchString === "") return true;
        return (
          mutiSearch(item.name, searchString) ||
          mutiSearch(item.description, searchString) ||
          mutiSearch(item.url, searchString)
        );
      });
  }, [data, currTag, searchString]);

  const restoreTag = useCallback((categories: string[]) => {
    const tagInLocalStorage = window.localStorage.getItem("tag");
    if (tagInLocalStorage && tagInLocalStorage !== "" && categories.includes(tagInLocalStorage)) {
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
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const category = entry.target.id.replace("category-", "");
            setVisibleCategory(category);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "-80px 0px -50% 0px",
        root: document.querySelector(".desktop-content-shell"),
      }
    );

    categories.forEach((category) => {
      const element = document.getElementById(`category-${category}`);
      if (element) observer.observe(element);
    });

    if (categories.length > 0) {
      setVisibleCategory(categories[0]);
    }

    return () => observer.disconnect();
  }, [groupedData]);

  const scrollToCategory = useCallback((category: string) => {
    const element = document.getElementById(`category-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const onKeyEnter = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter") {
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
      if (event.ctrlKey || event.metaKey) {
        const cards = filteredDataRef.current;
        const num = Number(event.key);
        if (Number.isNaN(num)) return;
        event.preventDefault();
        const index = Number(event.key) - 1;
        if (index >= 0 && index < cards.length) {
          window.open(cards[index]?.url, "_blank");
          resetSearch();
        }
      }
    },
    [resetSearch, searchString, selectedEngine]
  );

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

export function useBackgroundEffect(enableSurfaceEffects: boolean, enableBackground: boolean) {
  useEffect(() => {
    if (localStorage.getItem("nav-bg") === "1") {
      document.body.classList.add("has-background");
    }
  }, []);

  useEffect(() => {
    const body = document.body;
    body.classList.toggle("surface-effects", enableSurfaceEffects);
    body.classList.toggle("has-background", enableBackground);
    localStorage.setItem("nav-bg", enableBackground ? "1" : "0");
    return () => {
      body.classList.remove("surface-effects");
      body.classList.remove("has-background");
    };
  }, [enableSurfaceEffects, enableBackground]);
}
