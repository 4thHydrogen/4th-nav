import { useEffect, useState } from "react";
import { parsePexelsUrl, fetchPexelsImage, getCurrentTheme } from "../../utils/pexels";
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

  useEffect(() => {
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
        .then((newUrl) => {
          const img = new Image();
          img.onload = () => setImageUrl(newUrl);
          img.onerror = () => {};
          img.src = newUrl;
        })
        .catch(() => {});
      return;
    }

    // Bing mode
    if (lowerUrl === "bing" || lowerUrl.includes("bing.com")) {
      fetch(BING_API, { redirect: "follow" })
        .then((res) => {
          if (res.url) setImageUrl(res.url);
        })
        .catch(() => setImageUrl(url));
      return;
    }

    // Direct URL
    setImageUrl(url);
  }, [url, enabled, pexelsApiKey, refreshKey]);

  // Re-fetch from Pexels when theme changes
  useEffect(() => {
    if (!enabled || !url) return;
    const { isPexels, query } = parsePexelsUrl(url);
    if (!isPexels || !pexelsApiKey) return;

    const observer = new MutationObserver(() => {
      const theme = getCurrentTheme();
      fetchPexelsImage(pexelsApiKey, query, theme)
        .then(setImageUrl)
        .catch(() => {});
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [url, enabled, pexelsApiKey, refreshKey]);

  if (!enabled || !imageUrl) return null;

  return (
    <div
      className="background-layer"
      style={{ backgroundImage: `url(${imageUrl})` }}
    />
  );
};

export default Background;
