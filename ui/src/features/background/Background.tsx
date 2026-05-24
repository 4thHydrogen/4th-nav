import { useEffect, useState, useCallback } from "react";
import { getCurrentTheme } from "../../utils/pexels";
import {
  fetchCurrentBackground,
  refreshBackground,
  type ResolvedBackground,
} from "./api/resolveBackground";
import { useBackgroundAccentColors } from "./model/useBackgroundAccentColors";
import { useSearchEdgeLightMap } from "../search/experiments/useSearchEdgeLightMap";
import "./background.css";

interface BackgroundProps {
  url: string;
  enabled: boolean;
  refreshKey?: number;
  onAutoRefreshStateChange?: (
    status: "idle" | "loading" | "success" | "error",
    message?: string
  ) => void;
}

const Background = ({
  url,
  enabled,
  refreshKey,
  onAutoRefreshStateChange,
}: BackgroundProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [attribution, setAttribution] = useState<ResolvedBackground | null>(
    null
  );

  useBackgroundAccentColors(imageUrl || null);
  useSearchEdgeLightMap(imageUrl || null);

  const loadImageWithFade = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      setImageUrl(src);
      requestAnimationFrame(() => setLoaded(true));
    };
    img.onerror = () => {
      setLoaded(false);
    };
    img.src = src;
  }, []);

  const applyResult = useCallback(
    (result: ResolvedBackground | null) => {
      if (result?.localUrl) {
        setAttribution(result);
        loadImageWithFade(result.localUrl);
      }
    },
    [loadImageWithFade]
  );

  const handleBackgroundLoad = useCallback(
    (theme: string) => {
      fetchCurrentBackground(theme)
        .then((result) => {
          if (result?.localUrl) {
            applyResult(result);
            return;
          }
          onAutoRefreshStateChange?.("loading");
          return refreshBackground(url, theme).then((fresh) => {
            onAutoRefreshStateChange?.("success");
            applyResult(fresh);
          });
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : "壁纸加载失败";
          onAutoRefreshStateChange?.("error", message);
        });
    },
    [url, applyResult, onAutoRefreshStateChange]
  );

  useEffect(() => {
    setLoaded(false);
    if (!enabled || !url) {
      setImageUrl("");
      setAttribution(null);
      return;
    }

    handleBackgroundLoad(getCurrentTheme());
  }, [url, enabled, refreshKey, handleBackgroundLoad]);

  useEffect(() => {
    if (!enabled || !url) return;

    const observer = new MutationObserver(() => {
      handleBackgroundLoad(getCurrentTheme());
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [enabled, url, handleBackgroundLoad]);

  if (!enabled) return null;

  return (
    <>
      <div
        className="background-layer"
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          opacity: loaded ? 1 : 0,
        }}
      />
      {attribution && attribution.photographer && (
        <a
          className="pexels-credit"
          href={attribution.photoPageUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Photo by {attribution.photographer} on Pexels
        </a>
      )}
    </>
  );
};

export default Background;
