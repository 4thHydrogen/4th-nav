import { useState, useEffect, useMemo } from "react";
import { getLogoUrl, isInlineSvg } from "../../utils/check";
import { sanitizeSvg } from "../../utils/sanitize";

interface LogoIconProps {
  logo: string;
  name: string;
  /** URL of the tool (used for admin tool special case) */
  toolUrl?: string;
  size?: number;
  radius?: number | string;
  className?: string;
  fallbackFontSize?: number;
}

export default function LogoIcon({
  logo,
  name,
  toolUrl,
  size = 48,
  radius = 8,
  className,
  fallbackFontSize,
}: LogoIconProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [logo]);

  const fallbackSize = fallbackFontSize ?? Math.max(10, size * 0.3);

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
          width: size,
          height: size,
          borderRadius: radius,
          fontSize: fallbackSize,
          fontWeight: 600,
          color: "var(--widget-text-muted)",
          userSelect: "none",
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
        style={{ display: "flex", width: size, height: size, borderRadius: radius, overflow: "hidden" }}
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(logo) }}
      />
    );
  }

  return (
    <span
      className={className}
      style={{ display: "flex", width: size, height: size, borderRadius: radius, overflow: "hidden" }}
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
