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
  Tooltip,
} from "antd";
import { CircleHelp } from "lucide-react";
import React, { useCallback, useState, useEffect } from "react";
import { getFilter, getOptions, mutiSearch } from "../../../../utils/admin";
import { fetchUpdateToolsSort } from "../../../../shared/api/tool";
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
import type { Tool } from "../../../../types";
import { useToolMutations } from "../../../../features/admin-tools/useToolMutations";
import { useToolBulkActions } from "../../../../features/admin-tools/useToolBulkActions";
import { useImportExport } from "../../../../features/admin-tools/useImportExport";
import { message } from "antd";

export interface ToolsProps {}
export const Tools: React.FC<ToolsProps> = () => {
  const { store, loading, reload } = useData();
  const [showEdit, setShowEdit] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [addForm] = Form.useForm();
  const [addFolderForm] = Form.useForm();
  const [searchString, setSearchString] = useState("");
  const [catelogName, setCatelogName] = useState("");
  const [updateForm] = Form.useForm();
  const [selectedRows, setSelectRows] = useState<DataType[]>([]);
  const [dataSource, setDataSource] = useState<DataType[]>([]);

  const { handleDelete, handleUpdate, handleCreate, handleCreateFolder } =
    useToolMutations(reload);
  const { handleBulkDelete, handleBulkResetLogo, handleBulkCacheLogo } =
    useToolBulkActions(reload, selectedRows);
  const { handleImport, handleExport } = useImportExport(reload);

  const wrappedHandleCreate = useCallback(
    async (record: DataType) => {
      setRequestLoading(true);
      await handleCreate(record);
      setRequestLoading(false);
      setShowAddModel(false);
    },
    [handleCreate]
  );

  const wrappedHandleCreateFolder = useCallback(
    async (record: DataType) => {
      setRequestLoading(true);
      await handleCreateFolder(record);
      setRequestLoading(false);
      setShowAddFolder(false);
      addFolderForm.resetFields();
    },
    [handleCreateFolder, addFolderForm]
  );

  const wrappedHandleUpdate = useCallback(
    async (record: DataType) => {
      setRequestLoading(true);
      await handleUpdate(record);
      setRequestLoading(false);
      setShowEdit(false);
    },
    [handleUpdate]
  );

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
          <Button onClick={() => {
            addFolderForm.resetFields();
            addFolderForm.setFieldsValue({ type: "folder", sort: 1, hide: false, size: "1x1" });
            setShowAddFolder(true);
          }}>
            添加文件夹
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
                title="布局"
                dataIndex="viewMode"
                width={70}
                render={(val: string) => val === "card" ? "卡片" : "图标"}
              />
              <Table.Column
                title="类型"
                dataIndex="type"
                width={60}
                render={(val: string) => val === "folder" ? "文件夹" : "工具"}
              />
              <Table.Column
                title="所属文件夹"
                dataIndex="parentId"
                width={90}
                render={(val: number | null) => {
                  if (val == null) return "-";
                  const folder = store?.tools?.find((t: Tool) => t.id === val);
                  return folder ? folder.name : `#${val}`;
                }}
              />
              <Table.Column
                title={
                  <span>
                    隐藏
                    <Tooltip title="开启后只有登录后才会展示该工具">
                      <CircleHelp size={14} style={{ marginLeft: "5px" }} />
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
                    {record.type === "folder" ? (
                      <Button type="link" onClick={() => handleDelete(record.id)}>
                        删除
                      </Button>
                    ) : (
                      <Popconfirm
                        onConfirm={() => handleDelete(record.id)}
                        title={`确定要删除 ${record.name} 吗？`}
                      >
                        <Button type="link">删除</Button>
                      </Popconfirm>
                    )}
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
        existingTools={store?.tools || []}
        onOk={() => wrappedHandleCreate(addForm.getFieldsValue())}
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
        existingTools={store?.tools || []}
        onOk={() => wrappedHandleUpdate(updateForm.getFieldsValue())}
        onCancel={() => setShowEdit(false)}
      />
      <ToolFormModal
        open={showAddFolder}
        mode="add"
        loading={requestLoading}
        form={addFolderForm}
        categories={store?.catelogs || []}
        existingTools={store?.tools || []}
        onOk={() => wrappedHandleCreateFolder(addFolderForm.getFieldsValue())}
        onCancel={() => { setShowAddFolder(false); addFolderForm.resetFields(); }}
        afterClose={() => addFolderForm.resetFields()}
      />
    </Card>
  );
};
