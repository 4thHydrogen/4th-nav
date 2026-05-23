import { useEffect, useState } from "react";
import { Button, Form, Image, Input, Modal, Space, Spin, Switch, Table, message } from "antd";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import {
  fetchAddSearchEngine,
  fetchDeleteSearchEngine,
  fetchGetAllSearchEngines,
  fetchUpdateSearchEngine,
  fetchUpdateSearchEnginesSort,
} from "../../../shared/api/search-engine";
import type { SearchEngine } from "../../../types";

const DraggableRow = ({ children, ...props }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props["data-row-key"],
  });

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 9999 } : {}),
  };

  const modifiedListeners = {
    ...listeners,
    onPointerDown: (event: any) => {
      if (event.target.closest(".drag-handle")) {
        listeners.onPointerDown?.(event);
      }
    },
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes} {...modifiedListeners}>
      {children}
    </tr>
  );
};

const SearchEngineManager: React.FC = () => {
  const [engines, setEngines] = useState<SearchEngine[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingEngine, setEditingEngine] = useState<SearchEngine | null>(null);
  const [form] = Form.useForm<SearchEngine>();

  const loadEngines = async () => {
    try {
      setLoading(true);
      const data = await fetchGetAllSearchEngines();
      setEngines(data);
    } catch {
      message.error("加载搜索引擎失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngines();
  }, []);

  const handleToggleEnabled = async (engine: SearchEngine, enabled: boolean) => {
    try {
      await fetchUpdateSearchEngine({ ...engine, enabled });
      message.success("更新成功");
      loadEngines();
    } catch {
      message.error("更新失败");
    }
  };

  const handleEdit = (engine: SearchEngine) => {
    setEditingEngine(engine);
    form.setFieldsValue(engine);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetchDeleteSearchEngine(id);
      message.success("删除成功");
      loadEngines();
    } catch {
      message.error("删除失败");
    }
  };

  const handleAdd = () => {
    setEditingEngine(null);
    form.resetFields();
    setOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingEngine) {
        await fetchUpdateSearchEngine({ ...values, id: editingEngine.id });
        message.success("修改成功");
      } else {
        await fetchAddSearchEngine({ ...values, enabled: true });
        message.success("添加成功");
      }
      setOpen(false);
      loadEngines();
    } catch {
      // form validation handles visible errors
    }
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const activeIndex = engines.findIndex((item) => item.id === active.id);
    const overIndex = engines.findIndex((item) => item.id === over.id);
    const newItems = [...engines];
    const [reorderedItem] = newItems.splice(activeIndex, 1);
    newItems.splice(overIndex, 0, reorderedItem);

    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      sort: index + 1,
    }));

    setEngines(reorderedItems);

    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        sort: index + 1,
      }));
      await fetchUpdateSearchEnginesSort(updates);
      message.success("排序已更新");
    } catch {
      message.error("排序更新失败");
      loadEngines();
    }
  };

  const columns = [
    {
      title: "排序",
      dataIndex: "sort",
      width: 60,
      render: () => (
        <div
          className="drag-handle"
          style={{ cursor: "move", padding: 8, display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <GripVertical size={16} className="text-gray-400" />
        </div>
      ),
    },
    {
      title: "Logo",
      dataIndex: "logo",
      width: 80,
      render: (logo: string, record: SearchEngine) => (
        <Image
          src={logo.startsWith("http") ? logo : `/api/img?url=${logo}`}
          alt={record.name}
          width={24}
          height={24}
          fallback="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
        />
      ),
    },
    { title: "名称", dataIndex: "name" },
    { title: "基础 URL", dataIndex: "baseUrl" },
    { title: "查询参数", dataIndex: "queryParam" },
    {
      title: "启用",
      dataIndex: "enabled",
      render: (enabled: boolean, record: SearchEngine) => (
        <Switch checked={enabled} onChange={(checked) => handleToggleEnabled(record, checked)} />
      ),
    },
    {
      title: "操作",
      width: 120,
      render: (_: unknown, record: SearchEngine) => (
        <Space>
          <Button type="text" icon={<Pencil size={14} />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<Plus size={14} />} onClick={handleAdd}>
          添加搜索引擎
        </Button>
      </div>

      <Spin spinning={loading}>
        <DndContext onDragEnd={onDragEnd}>
          <SortableContext items={engines.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <Table
              columns={columns}
              dataSource={engines}
              rowKey="id"
              components={{ body: { row: DraggableRow } }}
              pagination={false}
            />
          </SortableContext>
        </DndContext>
      </Spin>

      <Modal title={editingEngine ? "编辑搜索引擎" : "添加搜索引擎"} open={open} onOk={handleModalOk} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入搜索引擎名称" }]}>
            <Input placeholder="例如：百度" />
          </Form.Item>
          <Form.Item name="baseUrl" label="基础 URL" rules={[{ required: true, message: "请输入基础 URL" }]}>
            <Input placeholder="例如：https://www.baidu.com/s" />
          </Form.Item>
          <Form.Item name="queryParam" label="查询参数" rules={[{ required: true, message: "请输入查询参数" }]}>
            <Input placeholder="例如：wd" />
          </Form.Item>
          <Form.Item
            name="logo"
            label="Logo"
            rules={[
              { required: true, message: "请输入 Logo 文件名或网址" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const urlPattern = /^https?:\/\/.+/i;
                  const filePattern = /\.(ico|png|jpg|jpeg|gif|svg|webp)$/i;
                  if (urlPattern.test(value) || filePattern.test(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("请输入有效的网址(http/https)或图标文件名(.ico/.png/.jpg 等)"));
                },
              },
            ]}
          >
            <Input placeholder="例如：baidu.ico 或 https://example.com/logo.png" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SearchEngineManager;
