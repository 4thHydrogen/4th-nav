import {
  Button,
  Card,
  Popconfirm,
  Space,
  Spin,
  Table,
  Form,
  Input,
  Select,
  Upload,
  message,
  Tooltip,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import React, { useCallback, useState, useEffect } from "react";
import { getFilter, getOptions, mutiSearch } from "../../../../utils/admin";
import {
  fetchAddTool,
  fetchDeleteTool,
  fetchExportTools,
  fetchImportTools,
  fetchUpdateTool,
  fetchUpdateToolsSort,
} from "../../../../utils/api";
import { useData } from "../../hooks/useData";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Row, DragHandle, type DataType } from "./DraggableRow";
import ToolFormModal from "./ToolFormModal";
import type { UpdateToolDto, AddToolDto, Tool } from "../../../../types";

export interface ToolsProps {}
export const Tools: React.FC<ToolsProps> = () => {
  const { store, loading, reload } = useData();
  const [showEdit, setShowEdit] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [addForm] = Form.useForm();
  const [searchString, setSearchString] = useState("");
  const [catelogName, setCatelogName] = useState("");
  const [updateForm] = Form.useForm();
  const [selectedRows, setSelectRows] = useState<DataType[]>([]);
  const [dataSource, setDataSource] = useState<DataType[]>([]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await fetchDeleteTool(id);
        message.success("删除成功!");
      } catch {
        message.warning("删除失败!");
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleUpdate = useCallback(
    async (record: DataType) => {
      setRequestLoading(true);
      try {
        await fetchUpdateTool(record as unknown as UpdateToolDto);
        message.success("更新成功! Logo 将在 3 秒后刷新并加载！", 3);
        setTimeout(() => reload(), 3000);
      } catch {
        message.warning("更新失败!");
      } finally {
        setRequestLoading(false);
        setShowEdit(false);
        reload();
      }
    },
    [reload]
  );

  const handleCreate = useCallback(
    async (record: DataType) => {
      setRequestLoading(true);
      try {
        await fetchAddTool(record as unknown as AddToolDto);
        message.success("添加成功! Logo 将在 3 秒后刷新并加载！", 3);
        setTimeout(() => reload(), 3000);
      } catch {
        message.warning("添加失败!");
      } finally {
        setRequestLoading(false);
        setShowAddModel(false);
        reload();
      }
    },
    [reload]
  );

  const handleImport = useCallback(
    async (data: unknown) => {
      try {
        await fetchImportTools(data as Tool[]);
        message.success("导入成功!");
      } catch {
        message.warning("导入失败!");
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleBulkDelete = useCallback(async () => {
    try {
      for (const each of selectedRows) {
        try {
          await fetchDeleteTool(each.id);
        } catch {}
      }
      message.success("删除成功!");
    } catch {
      message.success("删除失败!");
    } finally {
      reload();
    }
  }, [reload, selectedRows]);

  const handleBulkResetLogo = useCallback(async () => {
    try {
      for (const each of selectedRows) {
        try {
          await fetchUpdateTool({ ...each, logo: "" } as unknown as UpdateToolDto);
        } catch {}
      }
      message.success("重置成功!");
    } catch {
      message.success("重置失败!");
    } finally {
      reload();
    }
  }, [reload, selectedRows]);

  const handleBulkCacheLogo = useCallback(async () => {
    try {
      for (const each of selectedRows) {
        try {
          await fetchUpdateTool(each as unknown as UpdateToolDto);
        } catch {}
      }
      message.success("重置成功!");
    } catch {
      message.success("重置失败!");
    } finally {
      reload();
    }
  }, [reload, selectedRows]);

  const handleExport = useCallback(async () => {
    const data = await fetchExportTools();
    const jsr = JSON.stringify(data);
    const blob = new Blob([jsr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tools.json";
    document.documentElement.appendChild(a);
    a.click();
    document.documentElement.removeChild(a);
    message.success("导出成功！");
    reload();
  }, [reload]);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setDataSource((previous) => {
        const activeIndex = previous.findIndex(
          (i) => i.id.toString() === active.id
        );
        const overIndex = previous.findIndex(
          (i) => i.id.toString() === over?.id
        );
        const newData = arrayMove(previous, activeIndex, overIndex);
        const updates = newData.map((item, index) => ({
          id: item.id,
          sort: index + 1,
        }));
        fetchUpdateToolsSort(updates)
          .then(() => {
            message.success("排序更新成功");
            reload();
          })
          .catch(() => {
            message.error("排序更新失败");
          });
        return newData;
      });
    }
  };

  useEffect(() => {
    if (store?.tools) {
      const filteredData = store.tools
        .filter((item: DataType) => {
          let show = false;
          if (searchString === "") {
            show = true;
          } else {
            show =
              mutiSearch(item.name, searchString) ||
              mutiSearch(item.desc, searchString);
          }
          if (!catelogName || catelogName === "") {
            show = show && true;
          } else {
            show = show && mutiSearch(item.catelog, catelogName);
          }
          return show;
        })
        .sort((a: DataType, b: DataType) => a.sort - b.sort);
      setDataSource(filteredData);
    }
  }, [store?.tools, searchString, catelogName]);

  return (
    <Card
      title={
        <Space>
          <span>{`当前共 ${store?.tools?.length ?? 0} 条`}</span>
          {selectedRows.length > 0 && (
            <Popconfirm
              title="确定删除这些吗？"
              onConfirm={handleBulkDelete}
            >
              <Button type="link">删除</Button>
            </Popconfirm>
          )}
          {selectedRows.length > 0 && (
            <Popconfirm
              title="确定重置这些的图标吗？（会自动获取网站默认的）"
              onConfirm={handleBulkResetLogo}
            >
              <Button type="link">重置默认图标</Button>
            </Popconfirm>
          )}
          {selectedRows.length > 0 && (
            <Popconfirm
              title="确定重新缓存这些的图标吗？（会自动获取图标缓存到数据库）"
              onConfirm={handleBulkCacheLogo}
            >
              <Button type="link">重置缓存图标</Button>
            </Popconfirm>
          )}
        </Space>
      }
      extra={
        <Space>
          <Select
            options={getOptions(store?.catelogs || [])}
            placeholder="分类筛选"
            allowClear
            onClear={() => setCatelogName("")}
            onChange={(name: string) => setCatelogName(name)}
          />
          <Input.Search
            allowClear
            onSearch={(s: string) => setSearchString(s.trim())}
          />
          <Button type="primary" onClick={() => setShowAddModel(true)}>
            添加
          </Button>
          <Button type="primary" onClick={reload}>
            刷新
          </Button>
          <Upload
            name="tools.json"
            maxCount={1}
            accept=".json"
            fileList={[]}
            beforeUpload={(file) => {
              const reader = new FileReader();
              reader.readAsText(file);
              reader.onload = (result) => {
                const tools = result?.target?.result;
                if (tools) {
                  handleImport(JSON.parse(tools as string));
                }
              };
              return false;
            }}
          >
            <Button type="primary">导入</Button>
          </Upload>
          <Button type="primary" onClick={handleExport}>
            导出
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext
            items={dataSource.map((i) => i.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <Table
              components={{ body: { row: Row } }}
              rowKey="id"
              dataSource={dataSource}
              rowSelection={{
                type: "checkbox",
                onChange: (_keys: React.Key[], rows: DataType[]) => {
                  setSelectRows(rows);
                },
              }}
              pagination={{
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                defaultPageSize: 10,
                showTotal: (total) => `共 ${total} 条`,
              }}
            >
              <Table.Column
                key="sort"
                align="center"
                width={50}
                title="排序"
                render={() => <DragHandle />}
              />
              <Table.Column title="ID" dataIndex="id" width={40} />
              <Table.Column
                title="名称"
                dataIndex="name"
                width={120}
                render={(_: unknown, record: DataType) => (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={`/api/img?url=${record.logo}`}
                      width={32}
                      height={32}
                      loading="lazy"
                      style={{ objectFit: "cover" }}
                      alt=""
                    />
                    <span style={{ marginLeft: 8 }}>{record.name}</span>
                  </div>
                )}
              />
              <Table.Column
                title="分类"
                dataIndex="catelog"
                width={60}
                filters={getFilter(store?.catelogs || [])}
                onFilter={(value: unknown, record: DataType) =>
                  value === record["catelog"]
                }
              />
              <Table.Column
                title="网址"
                dataIndex="url"
                width={150}
                render={(url: string) => (
                  <div
                    style={{
                      wordBreak: "break-all",
                      whiteSpace: "normal",
                    }}
                  >
                    {url}
                  </div>
                )}
              />
              <Table.Column
                title={
                  <span>
                    隐藏
                    <Tooltip title="开启后只有登录后才会展示该工具">
                      <QuestionCircleOutlined style={{ marginLeft: "5px" }} />
                    </Tooltip>
                  </span>
                }
                dataIndex="hide"
                width={50}
                render={(val: boolean) => (Boolean(val) ? "是" : "否")}
              />
              <Table.Column
                title="操作"
                width={40}
                dataIndex="action"
                key="action"
                render={(_: unknown, record: DataType) => (
                  <Space>
                    <Button
                      type="link"
                      onClick={() => {
                        updateForm.setFieldsValue(record);
                        setShowEdit(true);
                      }}
                    >
                      修改
                    </Button>
                    <Popconfirm
                      onConfirm={() => handleDelete(record.id)}
                      title={`确定要删除 ${record.name} 吗？`}
                    >
                      <Button type="link">删除</Button>
                    </Popconfirm>
                  </Space>
                )}
              />
            </Table>
          </SortableContext>
        </DndContext>
      </Spin>
      <ToolFormModal
        open={showAddModel}
        mode="add"
        loading={requestLoading}
        form={addForm}
        categories={store?.catelogs || []}
        onOk={() => handleCreate(addForm.getFieldsValue())}
        onCancel={() => {
          setShowAddModel(false);
          addForm.resetFields();
        }}
        afterClose={() => addForm.resetFields()}
      />
      <ToolFormModal
        open={showEdit}
        mode="edit"
        loading={requestLoading}
        form={updateForm}
        categories={store?.catelogs || []}
        onOk={() => handleUpdate(updateForm.getFieldsValue())}
        onCancel={() => setShowEdit(false)}
      />
    </Card>
  );
};
