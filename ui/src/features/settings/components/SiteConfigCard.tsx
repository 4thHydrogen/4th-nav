import { Button, Card, Form, Select, Slider, Spin, Switch } from "antd";
import type { FormInstance } from "antd";
import type { SiteConfig } from "../../../types";

const COLUMNS_OPTIONS = [
  { label: "6 列", value: 6 },
  { label: "8 列", value: 8 },
  { label: "10 列", value: 10 },
  { label: "12 列（默认）", value: 12 },
  { label: "14 列", value: 14 },
  { label: "16 列", value: 16 },
];

const MIN_COLUMNS = 6;
const MAX_COLUMNS = 16;

interface SiteConfigCardProps {
  form: FormInstance;
  loading: boolean;
  siteConfig: SiteConfig | null | undefined;
  onSubmit: (values: any) => Promise<void>;
}

function ColumnsPerRowHint() {
  const value = Form.useWatch("columnsPerRow");
  if (value == null) return null;
  if (value < MIN_COLUMNS) {
    return `建议设置为 ${MIN_COLUMNS} 列以上，当前值 ${value} 过小`;
  }
  if (value > MAX_COLUMNS) {
    return `建议设置为 ${MAX_COLUMNS} 列以内，当前值 ${value} 过大`;
  }
  return null;
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
            label="桌面网格列数"
            name="columnsPerRow"
            tooltip="控制桌面主面板横向划分为多少个基础网格单元。普通网页项目占 1 个单元，2×2 文件夹占 2 列 × 2 行。"
            help={<ColumnsPerRowHint />}
          >
            <Select options={COLUMNS_OPTIONS} />
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
