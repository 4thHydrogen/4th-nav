import { useEffect } from "react";

const SEARCH_INPUT_ID = "search-bar";
const SEARCH_TRIGGER_PATTERN = /[a-zA-Z0-9]|[\u4e00-\u9fa5]/;

export function useSearchFocusShortcut() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Enter" && !SEARCH_TRIGGER_PATTERN.test(event.key)) {
        return;
      }

      const searchInput = document.getElementById(SEARCH_INPUT_ID);
      if (searchInput) {
        searchInput.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
