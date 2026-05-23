import { useState, useEffect, useMemo } from "react";
import { getLogoUrl, isInlineSvg } from "../../utils/check";
import { sanitizeSvg } from "../../utils/sanitize";

interface LogoIconProps {
  logo: string;
  name: string;
  toolUrl?: string;
  /** Fixed px size. Ignored when fill=true. */
  size?: number | string;
  radius?: number | string;
  className?: string;
  fallbackFontSize?: number;
  /** When true, don't set inline width/height — let parent CSS control sizing */
  fill?: boolean;
}

export default function LogoIcon({
  logo,
  name,
  toolUrl,
  size = 48,
  radius = 8,
  className,
  fallbackFontSize,
  fill = false,
}: LogoIconProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [logo]);

  const numericSize = typeof size === "number" ? size : 48;
  const fallbackSize = fallbackFontSize ?? Math.max(10, numericSize * 0.3);
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
        onError={() => setImageError(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: typeof radius === "number" ? radius * 0.75 : radius,
        }}
      />
    </span>
  );
}
