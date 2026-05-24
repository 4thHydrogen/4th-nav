import { Button, Card, Divider, Form, Input, Select, Space, Spin, Switch } from "antd";
import type { FormInstance } from "antd";
import type { Setting } from "../../../../types";
import type { IconJobStatus } from "../../../../shared/api/tool";

interface SiteSettingsCardProps {
  form: FormInstance;
  loading: boolean;
  setting: Setting | null | undefined;
  iconJob: IconJobStatus | null;
  testingPexelsKey: boolean;
  onSubmit: (values: any) => Promise<void>;
  onTestPexelsKey: () => Promise<void>;
  onRefreshWallpaper: () => void;
  onClearWallpaperCache: () => void;
  onRefreshMissingIcons: () => Promise<void>;
  onForceRefreshAllIcons: () => Promise<void>;
  onClearIconCache: () => Promise<void>;
}

export function SiteSettingsCard({
  form,
  loading,
  setting,
  iconJob,
  testingPexelsKey,
  onSubmit,
  onTestPexelsKey,
  onRefreshWallpaper,
  onClearWallpaperCache,
  onRefreshMissingIcons,
  onForceRefreshAllIcons,
  onClearIconCache,
}: SiteSettingsCardProps) {
  return (
    <Card title="修改网站信息">
      <Spin spinning={loading}>
        <Form
          onFinish={onSubmit}
          initialValues={setting ?? {}}
          labelCol={{ span: 6 }}
          form={form}
        >
          <Form.Item
            label="网站 logo"
            name="favicon"
            tooltip="输入 logo 的 URL，仅支持 png 或 svg"
            required
            rules={[{ required: true, message: "请输入网站 logo 链接" }]}
          >
            <Input placeholder="请输入网站 logo" />
          </Form.Item>
          <Form.Item
            label="网站标题"
            name="title"
            required
            rules={[{ required: true, message: "请输入网站标题" }]}
          >
            <Input placeholder="请输入网站标题" />
          </Form.Item>
          <Form.Item label="备案信息" name="govRecord">
            <Input placeholder="请输入网站备案信息" />
          </Form.Item>
          <Form.Item
            label="默认跳转方式"
            name="jumpTargetBlank"
            rules={[{ required: true, message: "这是必填项" }]}
            tooltip="选择点击卡片后的默认跳转方式"
          >
            <Select
              options={[
                { label: "原地跳转", value: false },
                { label: "新标签页", value: true },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="logo 192x192"
            name="logo192"
            rules={[{ required: true, message: "请输入 192x192 的 logo 链接" }]}
            tooltip="192x192 的 logo，用于可安装的 web 应用"
          >
            <Input placeholder="192x192 的 logo 链接" />
          </Form.Item>
          <Form.Item
            label="logo 512x512"
            name="logo512"
            rules={[{ required: true, message: "请输入 512x512 的 logo 链接" }]}
            tooltip="512x512 的 logo，用于可安装的 web 应用"
          >
            <Input placeholder="512x512 的 logo 链接" />
          </Form.Item>
          <Form.Item label="隐藏管理员后台卡片" name="hideAdmin" tooltip="开启后将在前台隐藏管理员卡片">
            <Switch defaultChecked={Boolean(setting?.hideAdmin)} />
          </Form.Item>
          <Form.Item label="隐藏 Github 按钮" name="hideGithub" tooltip="开启后将在前台隐藏 Github 按钮">
            <Switch defaultChecked={Boolean(setting?.hideGithub)} />
          </Form.Item>
          <Form.Item label="隐藏跳转方式卡片" name="hideToggleJumpTarget" tooltip="开启后将在前台隐藏跳转方式卡片">
            <Switch defaultChecked={Boolean(setting?.hideToggleJumpTarget)} />
          </Form.Item>

          <Divider orientation="left" style={{ margin: "16px 0 12px" }}>
            壁纸配置
          </Divider>
          <div style={{ padding: "0 0 12px", color: "rgba(0,0,0,0.45)", fontSize: 13, lineHeight: 1.8 }}>
            <div><b>壁纸来源格式：</b></div>
            <div>`pexels`：根据当前主题自动获取匹配色调的背景图</div>
            <div>`pexels:关键词`：使用指定关键词搜索，例如 `pexels:ocean`、`pexels:mountain`</div>
            <div>`bing`：自动获取每日 Bing 壁纸</div>
            <div>其他 URL：直接使用该图片作为背景</div>
            <div style={{ marginTop: 4 }}>Pexels 模式会根据当前主题自动适配深浅色壁纸。</div>
          </div>
          <Form.Item label="背景图片 URL" name="backgroundUrl">
            <Input placeholder="例如：pexels、pexels:ocean、bing 或图片 URL" />
          </Form.Item>
          <Form.Item
            label="Pexels API Key"
            name="pexelsApiKey"
            tooltip="在 pexels.com/api 免费申请，用于获取高质量主题壁纸"
          >
            <Space.Compact style={{ width: "100%" }}>
              <Input.Password placeholder="请输入 Pexels API Key" style={{ flex: 1 }} />
              <Button loading={testingPexelsKey} onClick={onTestPexelsKey}>
                测试
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="壁纸换一张">
            <Button onClick={onRefreshWallpaper}>换一张壁纸</Button>
            <Button type="link" onClick={onClearWallpaperCache}>
              清除全部壁纸缓存
            </Button>
          </Form.Item>
          <Form.Item
            label="网络代理"
            name="proxy"
            tooltip="配置 HTTP 代理地址，仅用于获取网站图标。例如 http://127.0.0.1:7890，留空则直连"
          >
            <Input placeholder="http://127.0.0.1:7890" />
          </Form.Item>
          <Form.Item label="启用背景图片" name="enableBackground" tooltip="开启后页面将显示背景图片">
            <Switch defaultChecked={Boolean(setting?.enableBackground)} />
          </Form.Item>
          <Form.Item
            label="启用表面材质效果"
            name="enableSurfaceEffects"
            tooltip="开启后卡片和导航栏将使用统一的半透明表面材质效果"
          >
            <Switch defaultChecked={Boolean(setting?.enableSurfaceEffects)} />
          </Form.Item>

          <Divider orientation="left" style={{ margin: "16px 0 12px" }}>
            图标管理
          </Divider>
          <Form.Item label="图标操作">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space wrap>
                <Button loading={iconJob?.running} onClick={onRefreshMissingIcons}>
                  重新获取缺失图标
                </Button>
                <Button loading={iconJob?.running} onClick={onForceRefreshAllIcons}>
                  强制重新获取全部
                </Button>
                <Button danger onClick={onClearIconCache}>
                  清空图标缓存
                </Button>
              </Space>
              {iconJob && (iconJob.running || iconJob.total > 0) && (
                <div style={{ fontSize: 12, color: "#666" }}>
                  {iconJob.running ? "任务进行中..." : "任务完成"} -
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
  );
}
