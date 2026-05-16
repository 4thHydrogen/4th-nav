import { useEffect, useState } from "react";
import "./index.css";

interface BackgroundProps {
  url: string;
  enabled: boolean;
}

const BING_API = "https://bing.biturl.top/?resolution=1920&format=image";

const Background = ({ url, enabled }: BackgroundProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (!enabled || !url) {
      setImageUrl("");
      return;
    }

    const lowerUrl = url.toLowerCase().trim();
    if (lowerUrl === "bing" || lowerUrl.includes("bing.com")) {
      fetch(BING_API, { redirect: "follow" })
        .then((res) => {
          if (res.url) {
            setImageUrl(res.url);
          }
        })
        .catch(() => {
          setImageUrl(url);
        });
    } else {
      setImageUrl(url);
    }
  }, [url, enabled]);

  if (!enabled || !imageUrl) return null;

  return (
    <div
      className="background-layer"
      style={{ backgroundImage: `url(${imageUrl})` }}
    />
  );
};

export default Background;
