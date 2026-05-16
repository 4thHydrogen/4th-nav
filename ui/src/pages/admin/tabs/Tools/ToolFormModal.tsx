import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  Switch,
  Tooltip,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import React from "react";
import { getOptions } from "../../../../utils/admin";
import type { Catelog } from "../../../../types";

interface ToolFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  loading: boolean;
  form: ReturnType<typeof Form.useForm>[0];
  categories: Catelog[];
  onOk: () => void;
  onCancel: () => void;
  afterClose?: () => void;
}

const ToolFormModal: React.FC<ToolFormModalProps> = ({
  open,
  mode,
  loading,
  form,
  categories,
  onOk,
  onCancel,
  afterClose,
}) => {
  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      title={isEdit ? "修改工具" : "新建工具"}
      onCancel={onCancel}
      afterClose={afterClose}
      destroyOnClose
      onOk={onOk}
    >
      <Spin spinning={loading}>
        <Form form={form}>
          {isEdit && (
            <Form.Item name="id" label="序号" labelCol={{ span: 4 }}>
              <Input disabled />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            required
            label="名称"
            rules={[{ required: true, message: "请填写名称" }]}
            labelCol={{ span: 4 }}
          >
            <Input placeholder="请输入工具名称" />
          </Form.Item>
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
              placeholder={
                isEdit
                  ? "请输入 url"
                  : "请输入完整URL（以 http:// 或 https:// 开头）"
              }
            />
          </Form.Item>
          <Form.Item name="logo" label="logo 网址" labelCol={{ span: 4 }}>
            <Input placeholder="请输入 logo url, 为空则自动获取" />
          </Form.Item>
          <Form.Item
            name="catelog"
            required
            label="分类"
            labelCol={{ span: 4 }}
            rules={[{ required: true, message: "请选择分类" }]}
          >
            <Select
              options={getOptions(categories)}
              placeholder="请选择分类"
            />
          </Form.Item>
          <Form.Item
            name="desc"
            required
            label="描述"
            labelCol={{ span: 4 }}
            rules={[{ required: true, message: "请填写描述" }]}
          >
            <Input placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="sort"
            required
            label={
              <span>
                <Tooltip title="升序，按数字从小到大排序">
                  <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                </Tooltip>
                &nbsp;排序
              </span>
            }
            labelCol={{ span: 4 }}
            rules={[{ required: true, message: "请排序" }]}
            initialValue={isEdit ? undefined : 1}
          >
            <InputNumber placeholder="请输入排序" />
          </Form.Item>
          <Form.Item
            name="hide"
            required
            label={
              <span>
                <Tooltip title="开启后只有登录后才会展示该工具">
                  <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                </Tooltip>
                &nbsp;隐藏
              </span>
            }
            labelCol={{ span: 4 }}
            initialValue={isEdit ? undefined : false}
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ToolFormModal;
