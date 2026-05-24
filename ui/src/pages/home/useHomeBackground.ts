import { useCallback, useMemo, useState } from "react";
import { parsePexelsUrl } from "../../utils/pexels";
import { refreshBackground } from "../../features/background/api/resolveBackground";

export function useHomeBackground(backgroundUrl?: string, enableBackground?: boolean) {
  const isPexels = useMemo(() => {
    const url = backgroundUrl?.trim().toLowerCase() ?? "";
    return url === "pexels" || url.startsWith("pexels:");
  }, [backgroundUrl]);

  const [bgRefreshKey, setBgRefreshKey] = useState(0);

  const handleRefreshBg = useCallback(async () => {
    if (!backgroundUrl) return;
    try {
      await refreshBackground(backgroundUrl, undefined);
    } catch {
      // silent — the home page refresh is best-effort
    }
    setBgRefreshKey((value) => value + 1);
  }, [backgroundUrl]);

  const showRefresh = isPexels && !!enableBackground;

  return { isPexels, bgRefreshKey, handleRefreshBg, showRefresh };
}
