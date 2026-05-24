import Background from "./Background";
import type { Setting } from "../../types";

interface HomeBackgroundProps {
  setting?: Setting | null;
  refreshKey: number;
}

export default function HomeBackground({ setting, refreshKey }: HomeBackgroundProps) {
  return (
    <Background
      url={setting?.backgroundUrl ?? ""}
      enabled={setting?.enableBackground === true}
      refreshKey={refreshKey}
    />
  );
}
