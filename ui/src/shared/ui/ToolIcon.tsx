import { useEffect, useMemo, useState } from "react";
import { getLogoUrl, isInlineSvg } from "../../utils/check";
import { sanitizeSvg } from "../../utils/sanitize";

interface ToolIconProps {
  logo: string;
  name: string;
  toolUrl?: string;
  size?: number | string;
  radius?: number | string;
  className?: string;
  fallbackFontSize?: number;
  fill?: boolean;
  dimWhileLoading?: boolean;
}

export default function ToolIcon({
  logo,
  name,
  toolUrl,
  size = 48,
  radius = 8,
  className,
  fallbackFontSize,
  fill = false,
  dimWhileLoading = false,
}: ToolIconProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [logo]);

  const numericSize = typeof size === "number" ? size : 48;
  const fallbackSize = fallbackFontSize ?? Math.max(10, numericSize * 0.32);
  const dimStyle = fill
    ? { width: "100%" as const, height: "100%" as const }
    : { width: size, height: size };

  const src = useMemo(() => {
    if (!logo || isInlineSvg(logo)) return "";
    return toolUrl === "admin" ? logo : getLogoUrl(logo);
  }, [logo, toolUrl]);

  if (!logo || imageError) {
    return (
      <span
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...dimStyle,
          borderRadius: radius,
          fontSize: fallbackSize,
          fontWeight: 600,
          color: "var(--widget-text-muted)",
          background: "var(--widget-icon-bg, rgba(120, 130, 150, 0.12))",
          userSelect: "none",
          overflow: "hidden",
        }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  if (isInlineSvg(logo)) {
    return (
      <span
        className={className}
        style={{ display: "flex", ...dimStyle, borderRadius: radius, overflow: "hidden" }}
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(logo) }}
      />
    );
  }

  return (
    <span
      className={className}
      style={{ display: "flex", ...dimStyle, borderRadius: radius, overflow: "hidden" }}
    >
      <img
        src={src}
        alt={name}
        loading="lazy"
        draggable={false}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: !dimWhileLoading || imageLoaded ? 1 : 0.25,
          transition: "opacity 0.25s ease",
          borderRadius: typeof radius === "number" ? radius * 0.75 : radius,
        }}
      />
    </span>
  );
}
