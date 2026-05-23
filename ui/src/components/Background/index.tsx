import { useEffect, useState, useCallback } from "react";
import { parsePexelsUrl, fetchPexelsImage, getCurrentTheme, getCachedPexelsImage } from "../../utils/pexels";
import "./index.css";

interface BackgroundProps {
  url: string;
  enabled: boolean;
  pexelsApiKey?: string;
  refreshKey?: number;
}

const BING_API = "https://bing.biturl.top/?resolution=3840&format=image";

const Background = ({ url, enabled, pexelsApiKey, refreshKey }: BackgroundProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

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

  useEffect(() => {
    setLoaded(false);
    if (!enabled || !url) {
      setImageUrl("");
      return;
    }

    const lowerUrl = url.toLowerCase().trim();

    // Pexels mode
    const { isPexels, query } = parsePexelsUrl(url);
    if (isPexels) {
      if (!pexelsApiKey) {
        setImageUrl("");
        return;
      }
      const theme = getCurrentTheme();
      fetchPexelsImage(pexelsApiKey, query, theme)
        .then(loadImageWithFade)
        .catch(() => {});
      return;
    }

    // Bing mode
    if (lowerUrl === "bing" || lowerUrl.includes("bing.com")) {
      fetch(BING_API, { redirect: "follow" })
        .then((res) => {
          if (res.url) loadImageWithFade(res.url);
        })
        .catch(() => loadImageWithFade(url));
      return;
    }

    // Direct URL
    loadImageWithFade(url);
  }, [url, enabled, pexelsApiKey, refreshKey, loadImageWithFade]);

  // Re-fetch from Pexels when theme changes
  useEffect(() => {
    if (!enabled || !url) return;
    const { isPexels, query } = parsePexelsUrl(url);
    if (!isPexels || !pexelsApiKey) return;

    const observer = new MutationObserver(() => {
      const theme = getCurrentTheme();
      // Keep old image until new one is ready
      fetchPexelsImage(pexelsApiKey, query, theme)
        .then(loadImageWithFade)
        .catch(() => {});
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [url, enabled, pexelsApiKey, refreshKey, loadImageWithFade]);

  // Get attribution data
  const getAttribution = useCallback(() => {
    if (!url) return null;
    const { isPexels, query } = parsePexelsUrl(url);
    if (!isPexels) return null;
    const theme = getCurrentTheme();
    return getCachedPexelsImage(theme, query);
  }, [url]);

  if (!enabled) return null;

  const attribution = imageUrl ? getAttribution() : null;

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
          href={attribution.photoUrl}
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
