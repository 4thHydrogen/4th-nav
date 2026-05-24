import Background from "./Background";
import type { Setting } from "../../types";

interface HomeBackgroundProps {
  setting?: Setting | null;
  refreshKey: number;
  onAutoRefreshStateChange?: (
    status: "idle" | "loading" | "success" | "error",
    message?: string
  ) => void;
}

export default function HomeBackground({
  setting,
  refreshKey,
  onAutoRefreshStateChange,
}: HomeBackgroundProps) {
  return (
    <Background
      url={setting?.backgroundUrl ?? ""}
      enabled={setting?.enableBackground === true}
      refreshKey={refreshKey}
      onAutoRefreshStateChange={onAutoRefreshStateChange}
    />
  );
}
