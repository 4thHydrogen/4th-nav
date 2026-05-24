import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tooltip,
} from "antd";
import { CircleHelp, ImageIcon } from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import IconPicker from "../../../../components/IconPicker";
import type { Category, Tool, ToolSize, ToolType } from "../../../../types";
import { getLogoUrl, isInlineSvg } from "../../../../utils/check";
import { matchIconByDomain } from "../../../../utils/icon-presets";
import { sanitizeSvg } from "../../../../utils/sanitize";
import { getOptions } from "../../../../utils/admin";

interface ToolFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  loading: boolean;
  form: ReturnType<typeof Form.useForm>[0];
  categories: Category[];
  existingTools?: Tool[];
  onOk: () => void;
  onCancel: () => void;
  afterClose?: () => void;
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "";
  }
}

function findLogoByDomain(tools: Tool[], url: string): string {
  const domain = extractDomain(url);
  if (!domain) return "";
  const match = tools.find(
    (tool) => tool.logo && tool.url && extractDomain(tool.url) === domain
  );
  return match?.logo || "";
}

const ToolFormModal: React.FC<ToolFormModalProps> = ({
  open,
  mode,
  loading,
  form,
  categories,
  existingTools = [],
  onOk,
  onCancel,
  afterClose,
}) => {
  const isEdit = mode === "edit";
  const [pickerOpen, setPickerOpen] = useState(false);

  const logoValue = Form.useWatch("logo", form);
  const typeValue = Form.useWatch("type", form) as ToolType | undefined;
  const isFolder = typeValue === "folder";

  const logoPreview = useMemo(() => {
    if (!logoValue) return null;
    if (isInlineSvg(logoValue)) {
      return (
        <span
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(logoValue) }}
        />
      );
    }

    return (
      <img
        src={getLogoUrl(logoValue)}
        alt=""
        style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6 }}
      />
    );
  }, [logoValue]);

  const handleUrlBlur = useCallback(() => {
    if (isEdit || isFolder) return;
    const currentLogo = form.getFieldValue("logo");
    if (currentLogo) return;
    const url = form.getFieldValue("url");
    if (!url) return;

    const presetIcon = matchIconByDomain(url);
    if (presetIcon) {
      form.setFieldsValue({ logo: presetIcon });
      return;
    }

    const matched = findLogoByDomain(existingTools, url);
    if (matched) {
      form.setFieldsValue({ logo: matched });
    }
  }, [existingTools, form, isEdit, isFolder]);

  const handlePickIcon = useCallback(
    (logo: string) => {
      form.setFieldsValue({ logo });
      setPickerOpen(false);
    },
    [form]
  );

  const existingLogos = useMemo(
    () => existingTools.map((tool) => tool.logo).filter(Boolean),
    [existingTools]
  );

  const folderOptions = useMemo(
    () => existingTools.filter((tool) => tool.type === "folder"),
    [existingTools]
  );

  const modalTitle = useMemo(() => {
    if (isFolder) return isEdit ? "修改文件夹" : "新建文件夹";
    return isEdit ? "修改工具" : "新建工具";
  }, [isEdit, isFolder]);

  return (
    <>
      <Modal
        open={open}
        title={modalTitle}
        onCancel={onCancel}
        afterClose={afterClose}
        destroyOnClose
        onOk={onOk}
      >
        <Spin spinning={loading}>
          <Form form={form}>
            {isEdit && (
              <Form.Item name="id" label="编号" labelCol={{ span: 4 }}>
                <Input disabled />
              </Form.Item>
            )}

            <Form.Item
              name="type"
              label="类型"
              labelCol={{ span: 4 }}
              initialValue="icon"
            >
              <Select
                options={[
                  { label: "工具", value: "icon" },
                  { label: "文件夹", value: "folder" },
                ]}
                onChange={(value: ToolType) => {
                  if (value === "folder") {
                    form.setFieldsValue({
                      url: "",
                      viewMode: "icon",
                      parentId: null,
                    });
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="name"
              label="名称"
              rules={isFolder ? [] : [{ required: true, message: "请填写名称" }]}
              required={!isFolder}
              labelCol={{ span: 4 }}
            >
              <Input placeholder={isFolder ? "未命名文件夹（可选）" : "请输入工具名称"} />
            </Form.Item>

            {!isFolder && (
              <Form.Item
                name="url"
                required
                label="网址"
                labelCol={{ span: 4 }}
                rules={
                  isEdit
                    ? [{ required: true, message: "请填写网址" }]
                    : [
                        { required: true, message: "请填写网址" },
                        {
                          pattern: /^(https?:\/\/)/,
                          message: "网址必须以 http:// 或 https:// 开头",
                        },
                      ]
                }
              >
                <Input
                  placeholder={isEdit ? "请输入 url" : "请输入完整 URL（以 http:// 或 https:// 开头）"}
                  onBlur={handleUrlBlur}
                />
              </Form.Item>
            )}

            <Form.Item label="Logo" labelCol={{ span: 4 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Space>
                  <Form.Item name="logo" noStyle>
                    <Input.TextArea
                      rows={2}
                      placeholder={isFolder ? "文件夹图标（可选）" : "URL、SVG 代码，或点击选择图标（留空则自动获取）"}
                      style={{ width: 360, resize: "vertical" }}
                    />
                  </Form.Item>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {logoPreview}
                    <Button
                      icon={<ImageIcon size={14} />}
                      onClick={() => setPickerOpen(true)}
                      size="small"
                    >
                      选择
                    </Button>
                  </div>
                </Space>
              </Space>
            </Form.Item>

            <Form.Item
              name="category"
              required
              label="分类"
              labelCol={{ span: 4 }}
              rules={[{ required: true, message: "请选择分类" }]}
            >
              <Select options={getOptions(categories)} placeholder="请选择分类" />
            </Form.Item>

            {!isFolder && (
              <Form.Item name="description" label="描述" labelCol={{ span: 4 }}>
                <Input placeholder="请输入描述" />
              </Form.Item>
            )}

            {!isFolder && (
              <Form.Item
                name="viewMode"
                label="布局"
                labelCol={{ span: 4 }}
                initialValue={isEdit ? undefined : "icon"}
              >
                <Select
                  options={[
                    { label: "图标", value: "icon" },
                    { label: "卡片", value: "card" },
                  ]}
                />
              </Form.Item>
            )}

            {!isFolder && (
              <Form.Item name="parentId" label="所属文件夹" labelCol={{ span: 4 }}>
                <Select
                  allowClear
                  placeholder="无（显示在主页面）"
                  options={folderOptions.map((folder) => ({
                    label: folder.name,
                    value: folder.id,
                  }))}
                />
              </Form.Item>
            )}

            {isFolder && (
              <Form.Item
                name="size"
                label="大小"
                labelCol={{ span: 4 }}
                initialValue="1x1"
              >
                <Select
                  options={[
                    { label: "1x1", value: "1x1" },
                    { label: "1x2", value: "1x2" },
                    { label: "2x1", value: "2x1" },
                    { label: "2x2", value: "2x2" },
                  ]}
                />
              </Form.Item>
            )}

            {isFolder && (
              <Form.Item name="folderTint" label="文件夹色调" labelCol={{ span: 4 }}>
                <Input placeholder="例如 #89a7ff 或 rgba(137,167,255,0.18)" />
              </Form.Item>
            )}

            <Form.Item
              name="sort"
              required
              label={
                <span>
                  <Tooltip title="升序，按数字从小到大排序">
                    <CircleHelp size={14} style={{ marginLeft: "5px" }} />
                  </Tooltip>
                  &nbsp;排序
                </span>
              }
              labelCol={{ span: 4 }}
              rules={[{ required: true, message: "请输入排序" }]}
              initialValue={isEdit ? undefined : 1}
            >
              <InputNumber placeholder="请输入排序" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="hide"
              required
              label={
                <span>
                  <Tooltip title="开启后只有登录后才会显示">
                    <CircleHelp size={14} style={{ marginLeft: "5px" }} />
                  </Tooltip>
                  &nbsp;隐藏
                </span>
              }
              labelCol={{ span: 4 }}
              initialValue={isEdit ? undefined : false}
              valuePropName="checked"
            >
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
      <IconPicker
        open={pickerOpen}
        existingLogos={existingLogos}
        onSelect={handlePickIcon}
        onCancel={() => setPickerOpen(false)}
      />
    </>
  );
};

export default ToolFormModal;
