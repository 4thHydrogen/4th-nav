import { useCallback, useMemo, useState } from "react";
import { parsePexelsUrl, clearPexelsCache } from "../../utils/pexels";

export function useHomeBackground(backgroundUrl?: string, enableBackground?: boolean) {
  const isPexels = useMemo(() => {
    const url = backgroundUrl?.trim().toLowerCase() ?? "";
    return url === "pexels" || url.startsWith("pexels:");
  }, [backgroundUrl]);

  const [bgRefreshKey, setBgRefreshKey] = useState(0);

  const handleRefreshBg = useCallback(() => {
    const { query } = parsePexelsUrl(backgroundUrl ?? "");
    clearPexelsCache(query);
    setBgRefreshKey((k) => k + 1);
  }, [backgroundUrl]);

  const showRefresh = isPexels && !!enableBackground;

  return { isPexels, bgRefreshKey, handleRefreshBg, showRefresh };
}
