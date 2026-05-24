import { useEffect, useState, useCallback } from "react";
import { getCurrentTheme } from "../../utils/pexels";
import {
  fetchCurrentBackground,
  refreshBackground,
  type ResolvedBackground,
} from "./api/resolveBackground";
import { useBackgroundAccentColors } from "./model/useBackgroundAccentColors";
import "./background.css";

interface BackgroundProps {
  url: string;
  enabled: boolean;
  refreshKey?: number;
}

const Background = ({ url, enabled, refreshKey }: BackgroundProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [attribution, setAttribution] = useState<ResolvedBackground | null>(
    null
  );

  useBackgroundAccentColors(imageUrl || null);

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

  useEffect(() => {
    setLoaded(false);
    if (!enabled || !url) {
      setImageUrl("");
      setAttribution(null);
      return;
    }

    const theme = getCurrentTheme();
    fetchCurrentBackground(theme)
      .then((result) => {
        if (result?.localUrl) {
          applyResult(result);
          return;
        }
        // No cache — trigger a backend refresh
        return refreshBackground(url, theme).then((fresh) => {
          applyResult(fresh);
        });
      })
      .catch(() => {});
  }, [url, enabled, refreshKey, applyResult]);

  // Re-fetch when theme changes
  useEffect(() => {
    if (!enabled || !url) return;

    const observer = new MutationObserver(() => {
      const theme = getCurrentTheme();
      fetchCurrentBackground(theme)
        .then((result) => {
          if (result?.localUrl) {
            applyResult(result);
            return;
          }
          return refreshBackground(url, theme).then((fresh) => {
            applyResult(fresh);
          });
        })
        .catch(() => {});
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [url, enabled, refreshKey, applyResult]);

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
