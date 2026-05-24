import { Form, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import type { AdminApiData } from "../../types";
import {
  fetchClearIconCache,
  fetchRefreshAllIcons,
  fetchRefreshMissingIcons,
} from "../../shared/api/tool";
import {
  fetchUpdateSetting,
  fetchUpdateSiteConfig,
  fetchUpdateUser,
} from "../../shared/api/setting";
import { useIconJobPolling } from "../../pages/admin/hooks/useIconJobPolling";
import {
  clearAllPexelsCache,
  clearPexelsCache,
  fetchPexelsImage,
  getCurrentTheme,
  parsePexelsUrl,
} from "../../utils/pexels";

interface UseSettingsPanelOptions {
  store: AdminApiData | null;
  reload: () => Promise<void>;
}

export function useSettingsPanel({ store, reload }: UseSettingsPanelOptions) {
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
        message.success("用户信息已更新");
      } catch {
        message.warning("更新用户信息失败");
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
        message.success("站点设置已更新");
      } catch {
        message.warning("更新站点设置失败");
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
        message.success("展示配置已更新");
      } catch {
        message.warning("更新展示配置失败");
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
      message.error("API Key 无效或网络异常，请检查后重试");
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
    message.success("壁纸缓存已刷新，稍后生效");
  }, [reload, settingForm]);

  const handleClearWallpaperCache = useCallback(() => {
    clearAllPexelsCache();
    message.success("已清除全部壁纸缓存");
  }, []);

  const handleRefreshMissingIcons = useCallback(async () => {
    const res = await fetchRefreshMissingIcons();
    message.success(res?.message || "图标任务已开始");
    pollIconStatus();
  }, [pollIconStatus]);

  const handleForceRefreshAllIcons = useCallback(async () => {
    if (!confirm("将强制重新获取全部工具图标，确定继续吗？")) {
      return;
    }

    const res = await fetchRefreshAllIcons(true, true);
    message.success(res?.message || "图标任务已开始");
    pollIconStatus();
  }, [pollIconStatus]);

  const handleClearIconCache = useCallback(async () => {
    if (!confirm("将清空全部图标缓存，确定继续吗？")) {
      return;
    }

    const res = await fetchClearIconCache("cache-only");
    message.success(res?.message || "图标缓存已清空");
    reload();
  }, [reload]);

  return {
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
  };
}
