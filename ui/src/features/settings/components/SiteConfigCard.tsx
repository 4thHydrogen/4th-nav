import { Button, Card, Form, Select, Slider, Spin, Switch } from "antd";
import type { FormInstance } from "antd";
import type { SiteConfig } from "../../../types";

interface SiteConfigCardProps {
  form: FormInstance;
  loading: boolean;
  siteConfig: SiteConfig | null | undefined;
  onSubmit: (values: any) => Promise<void>;
}

export function SiteConfigCard({
  form,
  loading,
  siteConfig,
  onSubmit,
}: SiteConfigCardProps) {
  return (
    <Card title="展示配置" style={{ marginTop: 32 }}>
      <Spin spinning={loading}>
        <Form
          onFinish={onSubmit}
          initialValues={siteConfig ?? {}}
          labelCol={{ span: 6 }}
          form={form}
        >
          <Form.Item
            label="无图模式"
            name="noImageMode"
            tooltip="开启后前台不再显示工具 logo 等图片"
          >
            <Switch defaultChecked={Boolean(siteConfig?.noImageMode)} />
          </Form.Item>
          <Form.Item
            label="精简模式"
            name="compactMode"
            tooltip="开启后卡片只显示标题和 logo；若同时开启无图模式，则仅显示标题"
          >
            <Switch defaultChecked={Boolean(siteConfig?.compactMode)} />
          </Form.Item>
          <Form.Item
            label="每行项目数"
            name="columnsPerRow"
            tooltip="设置桌面端每行显示的工具卡片数量"
          >
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
          <Form.Item
            label="图标密度"
            name="density"
            tooltip="控制桌面端图标显示密度，图标大小会自动适配"
          >
            <Select
              options={[
                { label: "紧凑", value: "compact" },
                { label: "标准（默认）", value: "standard" },
                { label: "宽松", value: "relaxed" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="列表行高"
            name="folderListItemSize"
            tooltip="文件夹列表模式下每一行的高度，20-60px"
          >
            <Slider min={20} max={60} step={2} marks={{ 20: "20", 28: "28", 40: "40", 60: "60" }} />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
}
