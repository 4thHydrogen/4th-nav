import { Button, Card, Form, Input, Modal, Popconfirm, Space, Spin, Table, Typography, message } from "antd";
import { useCallback, useState } from "react";
import { fetchAddApiToken, fetchDeleteApiToken } from "../../../shared/api/setting";
import type { AddTokenDto, Token } from "../../../types";
import { useData } from "../hooks/useData";

export interface ApiTokenProps {}

export const ApiToken: React.FC<ApiTokenProps> = () => {
  const [addForm] = Form.useForm<AddTokenDto>();
  const [open, setOpen] = useState(false);
  const { store, loading, reload } = useData();

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await fetchDeleteApiToken(id);
        message.success("删除成功");
      } catch {
        message.warning("删除失败");
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleCreate = useCallback(async () => {
    const values = await addForm.validateFields();
    try {
      await fetchAddApiToken(values);
      message.success("添加成功");
      setOpen(false);
      addForm.resetFields();
    } catch {
      message.warning("添加失败");
    } finally {
      reload();
    }
  }, [addForm, reload]);

  return (
    <Card
      title={`当前共 ${store?.tokens?.length ?? 0} 条`}
      extra={
        <Space>
          <Button type="primary" onClick={() => setOpen(true)}>
            添加
          </Button>
          <Button onClick={reload}>刷新</Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table<Token> dataSource={store?.tokens || []} rowKey="id" size="small">
          <Table.Column<Token> title="ID" dataIndex="id" width={80} />
          <Table.Column<Token> title="名称" dataIndex="name" width={180} />
          <Table.Column<Token>
            title="值"
            dataIndex="value"
            render={(value: string) => (
              <div style={{ maxWidth: 320 }}>
                <Typography.Text copyable ellipsis>
                  {value}
                </Typography.Text>
              </div>
            )}
          />
          <Table.Column<Token>
            title="操作"
            width={120}
            render={(_, record) => (
              <Popconfirm title={`确定删除 Token ${record.name} 吗？`} onConfirm={() => handleDelete(record.id)}>
                <Button type="link">删除</Button>
              </Popconfirm>
            )}
          />
        </Table>
      </Spin>

      <Modal open={open} title="新建 Token" onCancel={() => setOpen(false)} onOk={handleCreate}>
        <Form form={addForm}>
          <Form.Item
            name="name"
            required
            label="名称"
            labelCol={{ span: 4 }}
            rules={[{ required: true, message: "请输入 API Token 名称" }]}
          >
            <Input placeholder="请输入 API Token 名称" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
