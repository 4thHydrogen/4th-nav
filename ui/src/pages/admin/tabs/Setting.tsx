import { Form, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  fetchClearIconCache,
  fetchRefreshAllIcons,
  fetchRefreshMissingIcons,
} from "../../../shared/api/tool";
import {
  fetchUpdateSetting,
  fetchUpdateSiteConfig,
  fetchUpdateUser,
} from "../../../shared/api/setting";
import {
  clearAllPexelsCache,
  clearPexelsCache,
  fetchPexelsImage,
  getCurrentTheme,
  parsePexelsUrl,
} from "../../../utils/pexels";
import { SiteConfigCard } from "../components/settings/SiteConfigCard";
import { SiteSettingsCard } from "../components/settings/SiteSettingsCard";
import { UserSettingsCard } from "../components/settings/UserSettingsCard";
import { useData } from "../hooks/useData";
import { useIconJobPolling } from "../hooks/useIconJobPolling";

export interface SettingProps {}

export const Setting: React.FC<SettingProps> = () => {
  const { store, loading, reload } = useData();
  const [userForm] = Form.useForm();
  const [settingForm] = Form.useForm();
  const [siteConfigForm] = Form.useForm();
  const [testingPexelsKey, setTestingPexelsKey] = useState(false);
  const { iconJob, pollIconStatus } = useIconJobPolling(reload);

  useEffect(() => {
    userForm.setFieldsValue(store?.user ?? {});
    settingForm.setFieldsValue(store?.setting ?? {});
    siteConfigForm.setFieldsValue(store?.siteConfig ?? {});
  }, [siteConfigForm, settingForm, store, userForm]);

  const handleUpdateUser = useCallback(
    async (values: any) => {
      try {
        await fetchUpdateUser({ ...values, id: store?.user?.id });
        message.success("修改成功");
      } catch {
        message.warning("修改失败");
      } finally {
        reload();
      }
    },
    [reload, store]
  );

  const handleUpdateWebsite = useCallback(
    async (values: any) => {
      try {
        await fetchUpdateSetting(values);
        message.success("修改成功");
      } catch {
        message.warning("修改失败");
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleUpdateSiteConfig = useCallback(
    async (values: any) => {
      try {
        await fetchUpdateSiteConfig(values);
        message.success("修改成功");
      } catch {
        message.warning("修改失败");
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleTestPexelsKey = useCallback(async () => {
    const apiKey = settingForm.getFieldValue("pexelsApiKey");
    if (!apiKey) {
      message.warning("请先输入 Pexels API Key");
      return;
    }
    setTestingPexelsKey(true);
    try {
      await fetchPexelsImage(apiKey, "test", getCurrentTheme());
      message.success("API Key 有效，连接成功");
    } catch {
      message.error("API Key 无效或网络错误，请检查后重试");
    } finally {
      setTestingPexelsKey(false);
    }
  }, [settingForm]);

  const handleRefreshWallpaper = useCallback(() => {
    const bgUrl = settingForm.getFieldValue("backgroundUrl") || "";
    const { isPexels, query } = parsePexelsUrl(bgUrl);
    if (isPexels) {
      clearPexelsCache(query);
    } else {
      clearAllPexelsCache();
    }
    reload();
    message.success("壁纸已刷新，稍后生效");
  }, [reload, settingForm]);

  const handleClearWallpaperCache = useCallback(() => {
    clearAllPexelsCache();
    message.success("所有壁纸缓存已清除");
  }, []);

  const handleRefreshMissingIcons = useCallback(async () => {
    const res = await fetchRefreshMissingIcons();
    message.success(res?.message || "任务已开始");
    pollIconStatus();
  }, [pollIconStatus]);

  const handleForceRefreshAllIcons = useCallback(async () => {
    if (!confirm("将强制重新获取所有工具图标，确定继续吗？")) return;
    const res = await fetchRefreshAllIcons(true, true);
    message.success(res?.message || "任务已开始");
    pollIconStatus();
  }, [pollIconStatus]);

  const handleClearIconCache = useCallback(async () => {
    if (!confirm("将清空所有图标缓存，确定继续吗？")) return;
    const res = await fetchClearIconCache("cache-only");
    message.success(res?.message || "缓存已清空");
    reload();
  }, [reload]);

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
};
