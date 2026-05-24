import { SiteConfigCard } from "./components/SiteConfigCard";
import { SiteSettingsCard } from "./components/SiteSettingsCard";
import { UserSettingsCard } from "./components/UserSettingsCard";
import type { AdminApiData } from "../../types";
import { useSettingsPanel } from "./useSettingsPanel";

interface SettingsPanelProps {
  store: AdminApiData | null;
  loading: boolean;
  reload: () => Promise<void>;
}

export function SettingsPanel({
  store,
  loading,
  reload,
}: SettingsPanelProps) {
  const {
    userForm,
    settingForm,
    siteConfigForm,
    testingPexelsKey,
    iconJob,
    handleUpdateUser,
    handleUpdateWebsite,
    handleUpdateSiteConfig,
    handleTestPexelsKey,
    handleRefreshWallpaper,
    handleClearWallpaperCache,
    handleRefreshMissingIcons,
    handleForceRefreshAllIcons,
    handleClearIconCache,
  } = useSettingsPanel({ store, reload });

  return (
    <div className="overflow-auto">
      <UserSettingsCard
        form={userForm}
        loading={loading}
        user={store?.user}
        onSubmit={handleUpdateUser}
      />
      <SiteSettingsCard
        form={settingForm}
        loading={loading}
        setting={store?.setting}
        iconJob={iconJob}
        testingPexelsKey={testingPexelsKey}
        onSubmit={handleUpdateWebsite}
        onTestPexelsKey={handleTestPexelsKey}
        onRefreshWallpaper={handleRefreshWallpaper}
        onClearWallpaperCache={handleClearWallpaperCache}
        onRefreshMissingIcons={handleRefreshMissingIcons}
        onForceRefreshAllIcons={handleForceRefreshAllIcons}
        onClearIconCache={handleClearIconCache}
      />
      <SiteConfigCard
        form={siteConfigForm}
        loading={loading}
        siteConfig={store?.siteConfig}
        onSubmit={handleUpdateSiteConfig}
      />
    </div>
  );
}
