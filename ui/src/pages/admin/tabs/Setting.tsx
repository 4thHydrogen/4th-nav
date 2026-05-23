import { Button, Card, Divider, Form, Input, message, Select, Slider, Space, Spin, Switch } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchUpdateSetting, fetchUpdateUser, fetchUpdateSiteConfig } from "../../../utils/api";
import { fetchRefreshMissingIcons, fetchRefreshAllIcons, fetchClearIconCache, fetchIconJobStatus } from "../../../shared/api/tool";
import type { IconJobStatus } from "../../../shared/api/tool";
import { useData } from "../hooks/useData";
export interface SettingProps { }
export const Setting: React.FC<SettingProps> = (props) => {
  const { store, loading, reload } = useData();
  const [userForm] = Form.useForm();
  const [settingForm] = Form.useForm();
  const [siteConfigForm] = Form.useForm();
  const [iconJob, setIconJob] = useState<IconJobStatus | null>(null);
  const iconPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollIconStatus = useCallback(() => {
    if (iconPollRef.current) clearInterval(iconPollRef.current);
    iconPollRef.current = setInterval(async () => {
      const status = await fetchIconJobStatus();
      setIconJob(status);
      if (!status.running) {
        if (iconPollRef.current) clearInterval(iconPollRef.current);
        iconPollRef.current = null;
        reload();
      }
    }, 2000);
  }, [reload]);

  useEffect(() => {
    return () => { if (iconPollRef.current) clearInterval(iconPollRef.current); };
  }, []);

  useEffect(() => {
    userForm.setFieldsValue(store?.user ?? {})
    settingForm.setFieldsValue(store?.setting ?? {})
    siteConfigForm.setFieldsValue(store?.siteConfig ?? {})
  }, [store])
  const handleUpdateUser = useCallback(
    async (values: any) => {
      try {
        await fetchUpdateUser({ ...values, id: store?.user?.id });
        message.success("修改成功!");
      } catch (err) {
        message.warning("修改失败!");
      } finally {
        reload();
      }
    },
    [reload, store]
  );
  const handleUpdateWebSite = useCallback(
    async (values: any) => {
      try {
        await fetchUpdateSetting(values);
        message.success("修改成功!");
      } catch (err) {
        message.warning("修改失败!");
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
        message.success("修改成功!");
      } catch (err) {
        message.warning("修改失败!");
      } finally {
        reload();
      }
    },
    [reload]
  );
  return (
    <div className="overflow-auto">
      <Card title={`修改用户信息`} style={{ marginBottom: 32 }}>
        <Spin spinning={loading}>
          <Form onFinish={handleUpdateUser} initialValues={store?.user ?? {}} form={userForm}>
            <Form.Item
              label="用户名"
              name="name"
              required
              labelCol={{ span: 4 }}
            >
              <Input placeholder="请输入新用户名"></Input>
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              required
              labelCol={{ span: 4 }}
            >
              <Input.Password placeholder="请输入新密码" ></Input.Password>
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
      <Card title={`修改网站信息`}>
        <Spin spinning={loading}>
          <Form
            onFinish={handleUpdateWebSite}
            initialValues={store?.setting ?? {}}
            labelCol={{ span: 6 }}
            form={settingForm}
          >
            <Form.Item
              label="网站 logo"
              name="favicon"
              tooltip="输入 logo 的 url，仅支持 png 或 svg 格式"
              required
              rules={[{ required: true, message: "请输入网站 logo 链接" }]}

            >
              <Input placeholder="请输入网站 logo"></Input>
            </Form.Item>
            <Form.Item
              label="网站标题"
              name="title"
              required
              rules={[{ required: true, message: "请输入网站 title" }]}


            >
              <Input placeholder="请输入网站标题"></Input>
            </Form.Item>
            <Form.Item
              label="公信部备案"
              name="govRecord"
            >
              <Input placeholder="请输入网站备案信息"></Input>
            </Form.Item>


            <Form.Item label="默认跳转方式" name="jumpTargetBlank" rules={[{ required: true, message: "这是必填项" }]}
              tooltip="选择点击卡片后默认的跳转方式"
            >
              <Select options={[
                {
                  label: "原地跳转",
                  value: false,
                },
                {
                  label: "新标签页",
                  value: true,
                },
              ]}>

              </Select>

            </Form.Item>
            <Form.Item
              label="logo 192x192"
              name="logo192"
              rules={[{ required: true, message: "请输入 192x192 大小的 logo 链接" }]}

              tooltip="192x192 大小的 logo，用于实现可安装的 web 应用"

            >
              <Input placeholder="192x192 大小的 logo 链接"></Input>
            </Form.Item>
            <Form.Item
              label="logo 512x512"
              name="logo512"
              rules={[{ required: true, message: "请输入 512x512 大小的 logo 链接" }]}

              tooltip="512x512 大小的 logo，用于实现可安装的 web 应用"

            >
              <Input placeholder="512x512 大小的 logo 链接"></Input>
            </Form.Item>
            <Form.Item label="隐藏管理员后台卡片" name="hideAdmin" tooltip="默认展示，开启后将在前台隐藏管理员卡片" >
              <Switch defaultChecked={Boolean(store?.setting?.hideAdmin)} />
            </Form.Item>
            <Form.Item label="隐藏 Github 按钮" name="hideGithub" tooltip="默认展示，开启后将在前台隐藏 Github 按钮" >
              <Switch defaultChecked={Boolean(store?.setting?.hideGithub)} />
            </Form.Item>
            <Form.Item label="隐藏跳转方式卡片" name="hideToggleJumpTarget" tooltip="默认展示，开启后将在前台隐藏跳转方式卡片" >
              <Switch defaultChecked={Boolean(store?.setting?.hideToggleJumpTarget)} />
            </Form.Item>
            <Form.Item
              label="背景图片 URL"
              name="backgroundUrl"
              tooltip="输入图片 URL 作为页面背景。支持 bing 关键字自动获取每日 Bing 壁纸；支持 pexels 关键字获取主题感知背景（需配置 Pexels API Key）；也可输入 pexels:关键词 自定义搜索内容"
            >
              <Input placeholder="例如: bing、pexels、pexels:ocean 或 https://example.com/bg.jpg" />
            </Form.Item>
            <Form.Item
              label="Pexels API Key"
              name="pexelsApiKey"
              tooltip="在 pexels.com/api 免费申请。配置后背景图片 URL 输入 pexels 即可根据主题自动获取亮/暗色调背景图"
            >
              <Input.Password placeholder="请输入 Pexels API Key" />
            </Form.Item>
            <Form.Item
              label="网络代理"
              name="proxy"
              tooltip="配置 HTTP 代理地址，仅用于获取网站图标。例如: http://127.0.0.1:7890。留空则直连"
            >
              <Input placeholder="http://127.0.0.1:7890" />
            </Form.Item>
            <Form.Item label="启用背景图片" name="enableBackground" tooltip="开启后页面将显示背景图片">
              <Switch defaultChecked={Boolean(store?.setting?.enableBackground)} />
            </Form.Item>
            <Form.Item label="启用毛玻璃效果" name="enableGlassmorphism" tooltip="开启后卡片和导航栏将呈现毛玻璃半透明效果">
              <Switch defaultChecked={Boolean(store?.setting?.enableGlassmorphism)} />
            </Form.Item>
            <Divider orientation="left" style={{ margin: "16px 0 12px" }}>图标管理</Divider>
            <Form.Item label="图标操作">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Space wrap>
                  <Button
                    loading={iconJob?.running}
                    onClick={async () => {
                      const res = await fetchRefreshMissingIcons();
                      message.success(res?.message || "任务已开始");
                      pollIconStatus();
                    }}
                  >
                    重新获取缺失图标
                  </Button>
                  <Button
                    loading={iconJob?.running}
                    onClick={async () => {
                      if (!confirm("将强制重新获取所有工具图标，确定继续？")) return;
                      const res = await fetchRefreshAllIcons(true, true);
                      message.success(res?.message || "任务已开始");
                      pollIconStatus();
                    }}
                  >
                    强制重新获取全部
                  </Button>
                  <Button
                    danger
                    onClick={async () => {
                      if (!confirm("将清空所有图标缓存，确定继续？")) return;
                      const res = await fetchClearIconCache("cache-only");
                      message.success(res?.message || "缓存已清空");
                      reload();
                    }}
                  >
                    清空图标缓存
                  </Button>
                </Space>
                {iconJob && (iconJob.running || iconJob.total > 0) && (
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {iconJob.running ? "任务进行中..." : "任务完成"} —
                    总计 {iconJob.total}，成功 {iconJob.success}，失败 {iconJob.failed}
                    {iconJob.running && <>，已完成 {iconJob.done}</>}
                    {iconJob.lastError && <div style={{ color: "#ff4d4f" }}>最近错误：{iconJob.lastError}</div>}
                  </div>
                )}
              </Space>
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
      <Card title={`修改网站配置`} style={{ marginTop: 32 }}>
        <Spin spinning={loading}>
          <Form
            onFinish={handleUpdateSiteConfig}
            initialValues={store?.siteConfig ?? {}}
            labelCol={{ span: 6 }}
            form={siteConfigForm}
          >
            <Form.Item label="无图模式" name="noImageMode" tooltip="开启后前台将不展示工具logo等图片">
              <Switch defaultChecked={Boolean(store?.siteConfig?.noImageMode)} />
            </Form.Item>
            <Form.Item label="精简模式" name="compactMode" tooltip="开启后卡片只显示标题和logo，如果同时开启无图模式则只显示标题">
              <Switch defaultChecked={Boolean(store?.siteConfig?.compactMode)} />
            </Form.Item>
            <Form.Item label="每行项目数" name="columnsPerRow" tooltip="设置桌面端每行显示的工具卡片数量">
              <Select
                options={[
                  { label: "2 列", value: 2 },
                  { label: "3 列（默认）", value: 3 },
                  { label: "4 列", value: 4 },
                  { label: "5 列", value: 5 },
                  { label: "6 列", value: 6 },
                ]}
              />
            </Form.Item>
            <Form.Item label="图标密度" name="density" tooltip="控制桌面端图标的显示密度，图标大小会自动适应">
              <Select
                options={[
                  { label: "紧凑", value: "compact" },
                  { label: "标准（默认）", value: "standard" },
                  { label: "宽松", value: "relaxed" },
                ]}
              />
            </Form.Item>
            <Form.Item label="列表行高" name="folderListItemSize" tooltip="文件夹列表模式下每行的高度（20-60px）">
              <Slider min={20} max={60} step={2} marks={{ 20: '20', 28: '28', 40: '40', 60: '60' }} />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};
