import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentTheme } from "../../utils/pexels";
import { refreshBackground } from "../../features/background/api/resolveBackground";

export type RefreshStatus = "idle" | "loading" | "success" | "error";

export function useHomeBackground(backgroundUrl?: string, enableBackground?: boolean) {
  const isPexels = useMemo(() => {
    const url = backgroundUrl?.trim().toLowerCase() ?? "";
    return url === "pexels" || url.startsWith("pexels:");
  }, [backgroundUrl]);

  const [bgRefreshKey, setBgRefreshKey] = useState(0);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>("idle");
  const [refreshMessage, setRefreshMessage] = useState("");

  const updateRefreshState = useCallback((status: RefreshStatus, message?: string) => {
    setRefreshStatus(status);
    setRefreshMessage(message ?? "");
  }, []);

  const handleRefreshBg = useCallback(async () => {
    if (!backgroundUrl) return;

    setRefreshStatus("loading");
    setRefreshMessage("");

    try {
      const theme = getCurrentTheme();
      await refreshBackground(backgroundUrl, theme);

      setRefreshStatus("success");
      setRefreshMessage("");
      setBgRefreshKey((value) => value + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "壁纸刷新失败";
      setRefreshStatus("error");
      setRefreshMessage(message);
    }
  }, [backgroundUrl]);

  useEffect(() => {
    if (refreshStatus !== "success" && refreshStatus !== "error") return;

    const timer = window.setTimeout(() => {
      setRefreshStatus("idle");
      setRefreshMessage("");
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [refreshStatus]);

  const showRefresh = isPexels && !!enableBackground;

  return {
    isPexels,
    bgRefreshKey,
    handleRefreshBg,
    showRefresh,
    refreshStatus,
    refreshMessage,
    isRefreshing: refreshStatus === "loading",
    onAutoRefreshStateChange: updateRefreshState,
  };
}
