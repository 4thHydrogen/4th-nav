import { Button, Card, Form, Input, Spin } from "antd";
import type { FormInstance } from "antd";
import type { AdminApiData } from "../../../types";

interface UserSettingsCardProps {
  form: FormInstance;
  loading: boolean;
  user: AdminApiData["user"] | null | undefined;
  onSubmit: (values: any) => Promise<void>;
}

export function UserSettingsCard({
  form,
  loading,
  user,
  onSubmit,
}: UserSettingsCardProps) {
  return (
    <Card title="用户信息" style={{ marginBottom: 32 }}>
      <Spin spinning={loading}>
        <Form onFinish={onSubmit} initialValues={user ?? {}} form={form}>
          <Form.Item label="用户名" name="name" required labelCol={{ span: 4 }}>
            <Input placeholder="请输入新的用户名" />
          </Form.Item>
          <Form.Item label="密码" name="password" required labelCol={{ span: 4 }}>
            <Input.Password placeholder="请输入新的密码" />
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
