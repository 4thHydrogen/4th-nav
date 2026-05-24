import Background from "../../components/Background";
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
      pexelsApiKey={setting?.pexelsApiKey ?? ""}
      refreshKey={refreshKey}
    />
  );
}
