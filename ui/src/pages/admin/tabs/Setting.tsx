import { SettingsPanel } from "../../../features/settings/SettingsPanel";
import { useData } from "../hooks/useData";

export interface SettingProps {}

export const Setting: React.FC<SettingProps> = () => {
  const { store, loading, reload } = useData();

  return <SettingsPanel store={store} loading={loading} reload={reload} />;
};
