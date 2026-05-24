import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Space, Spin, Switch, Table, Tooltip, message } from "antd";
import { CircleHelp } from "lucide-react";
import { useCallback, useState } from "react";
import { fetchAddCategory, fetchDeleteCategory, fetchUpdateCategory } from "../../../shared/api/category";
import type { AddCategoryDto, Category as CategoryType, UpdateCategoryDto } from "../../../types";
import { useData } from "../hooks/useData";

export interface CategoryProps {}

export const Category: React.FC<CategoryProps> = () => {
  const { store, loading, reload } = useData();
  const [requestLoading, setRequestLoading] = useState(false);
  const [addForm] = Form.useForm<AddCategoryDto>();
  const [updateForm] = Form.useForm<UpdateCategoryDto>();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await fetchDeleteCategory(id);
        message.success("删除分类成功");
      } catch {
        message.warning("删除分类失败");
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleCreate = useCallback(async () => {
    const values = await addForm.validateFields();
    try {
      await fetchAddCategory(values);
      message.success("添加成功");
      setAddOpen(false);
      addForm.resetFields();
    } catch {
      message.warning("添加失败");
    } finally {
      reload();
    }
  }, [addForm, reload]);

  const handleUpdate = useCallback(async () => {
    const values = await updateForm.validateFields();
    setRequestLoading(true);
    try {
      await fetchUpdateCategory(values as UpdateCategoryDto);
      message.success("更新成功");
      setEditOpen(false);
    } catch {
      message.warning("更新失败");
    } finally {
      setRequestLoading(false);
      reload();
    }
  }, [reload, updateForm]);

  return (
    <Card
      title={`当前共 ${store?.categories?.length ?? 0} 条`}
      extra={
        <Space>
          <Button type="primary" onClick={() => setAddOpen(true)}>
            添加
          </Button>
          <Button onClick={reload}>刷新</Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table<CategoryType> dataSource={store?.categories || []} rowKey="id" size="small">
          <Table.Column<CategoryType> title="ID" dataIndex="id" width={80} />
          <Table.Column<CategoryType> title="名称" dataIndex="name" width={180} />
          <Table.Column<CategoryType>
            title={
              <span>
                排序
                <Tooltip title="升序，按数字从小到大排序">
                  <CircleHelp size={14} style={{ marginLeft: 5 }} />
                </Tooltip>
              </span>
            }
            dataIndex="sort"
            width={140}
          />
          <Table.Column<CategoryType>
            title={
              <span>
                隐藏
                <Tooltip title="开启后只有登录后才会显示该工具分类">
                  <CircleHelp size={14} style={{ marginLeft: 5 }} />
                </Tooltip>
              </span>
            }
            dataIndex="hide"
            width={100}
            render={(value: boolean) => (value ? "是" : "否")}
          />
          <Table.Column<CategoryType>
            title="操作"
            width={140}
            render={(_, record) => (
              <Space>
                <Button
                  type="link"
                  onClick={() => {
                    updateForm.setFieldsValue(record);
                    setEditOpen(true);
                  }}
                >
                  修改
                </Button>
                <Popconfirm title={`确定删除分类 ${record.name} 吗？`} onConfirm={() => handleDelete(record.id)}>
                  <Button type="link">删除</Button>
                </Popconfirm>
              </Space>
            )}
          />
        </Table>
      </Spin>

      <Modal open={addOpen} title="新建分类" onCancel={() => setAddOpen(false)} onOk={handleCreate}>
        <Form form={addForm} initialValues={{ sort: 1, hide: false }}>
          <Form.Item name="name" required label="名称" labelCol={{ span: 4 }} rules={[{ required: true, message: "请输入分类名称" }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="sort"
            required
            label={
              <span>
                <Tooltip title="升序，按数字从小到大排序">
                  <CircleHelp size={14} style={{ marginLeft: 5 }} />
                </Tooltip>
                &nbsp;排序
              </span>
            }
            labelCol={{ span: 4 }}
          >
            <InputNumber placeholder="请输入分类排序" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="hide"
            required
            valuePropName="checked"
            label={
              <span>
                <Tooltip title="开启后只有登录后才会显示该工具分类">
                  <CircleHelp size={14} style={{ marginLeft: 5 }} />
                </Tooltip>
                &nbsp;隐藏
              </span>
            }
            labelCol={{ span: 4 }}
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={editOpen} title="修改分类" onCancel={() => setEditOpen(false)} onOk={handleUpdate}>
        <Spin spinning={requestLoading}>
          <Form form={updateForm}>
            <Form.Item name="id" label="ID" labelCol={{ span: 4 }}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="name" required label="名称" labelCol={{ span: 4 }} rules={[{ required: true, message: "请输入分类名称" }]}>
              <Input placeholder="请输入分类名称" />
            </Form.Item>
            <Form.Item
              name="sort"
              required
              label={
                <span>
                  <Tooltip title="升序，按数字从小到大排序">
                    <CircleHelp size={14} style={{ marginLeft: 5 }} />
                  </Tooltip>
                  &nbsp;排序
                </span>
              }
              labelCol={{ span: 4 }}
            >
              <InputNumber placeholder="请输入分类排序" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="hide"
              required
              valuePropName="checked"
              label={
                <span>
                  <Tooltip title="开启后只有登录后才会显示该工具分类">
                    <CircleHelp size={14} style={{ marginLeft: 5 }} />
                  </Tooltip>
                  &nbsp;隐藏
                </span>
              }
              labelCol={{ span: 4 }}
            >
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </Card>
  );
};

export default Category;
