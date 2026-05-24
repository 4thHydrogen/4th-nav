import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CircleHelp } from "lucide-react";
import { Button, Popconfirm, Space, Table, Tooltip } from "antd";
import type { Category, Tool } from "../../types";
import { getFilter } from "../../utils/admin";
import { DragHandle, Row } from "./DraggableRow";
import type { ToolTableRecord } from "./useToolsTableModel";

interface ToolsTableProps {
  dataSource: ToolTableRecord[];
  categories: Category[];
  normalizedTools: Tool[];
  selectedRows: ToolTableRecord[];
  onSelectRows: (rows: ToolTableRecord[]) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onEdit: (record: ToolTableRecord) => void;
  onDelete: (id: number) => void;
}

export default function ToolsTable({
  dataSource,
  categories,
  normalizedTools,
  selectedRows,
  onSelectRows,
  onDragEnd,
  onEdit,
  onDelete,
}: ToolsTableProps) {
  return (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext
        items={dataSource.map((item) => item.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <Table
          components={{ body: { row: Row } }}
          rowKey="id"
          dataSource={dataSource}
          rowSelection={{
            type: "checkbox",
            selectedRowKeys: selectedRows.map((item) => item.id),
            onChange: (_keys, rows) => onSelectRows(rows as ToolTableRecord[]),
          }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            defaultPageSize: 10,
            showTotal: (total) => `共 ${total} 条`,
          }}
        >
          <Table.Column key="sort" align="center" width={50} title="排序" render={() => <DragHandle />} />
          <Table.Column title="ID" dataIndex="id" width={40} />
          <Table.Column
            title="名称"
            dataIndex="name"
            width={160}
            render={(_: unknown, record: ToolTableRecord) => (
              <div style={{ display: "flex", alignItems: "center" }}>
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
            dataIndex="category"
            width={90}
            filters={getFilter(categories)}
            onFilter={(value: unknown, record: ToolTableRecord) => value === record.category}
          />
          <Table.Column
            title="网址"
            dataIndex="url"
            width={180}
            render={(url: string) => (
              <div style={{ wordBreak: "break-all", whiteSpace: "normal" }}>{url}</div>
            )}
          />
          <Table.Column
            title="布局"
            dataIndex="viewMode"
            width={70}
            render={(value: string) => (value === "card" ? "卡片" : "图标")}
          />
          <Table.Column
            title="类型"
            dataIndex="type"
            width={70}
            render={(value: string) => (value === "folder" ? "文件夹" : "工具")}
          />
          <Table.Column
            title="所属文件夹"
            dataIndex="parentId"
            width={110}
            render={(value: number | null) => {
              if (value == null) return "-";
              const folder = normalizedTools.find((tool) => tool.id === value);
              return folder ? folder.name : `#${value}`;
            }}
          />
          <Table.Column
            title={
              <span>
                隐藏
                <Tooltip title="开启后只有登录后才会显示该工具">
                  <CircleHelp size={14} style={{ marginLeft: 5 }} />
                </Tooltip>
              </span>
            }
            dataIndex="hide"
            width={60}
            render={(value: boolean) => (Boolean(value) ? "是" : "否")}
          />
          <Table.Column
            title="操作"
            width={100}
            render={(_: unknown, record: ToolTableRecord) => (
              <Space>
                <Button type="link" onClick={() => onEdit(record)}>
                  编辑
                </Button>
                {record.type === "folder" ? (
                  <Button type="link" onClick={() => onDelete(record.id)}>
                    删除
                  </Button>
                ) : (
                  <Popconfirm onConfirm={() => onDelete(record.id)} title={`确定要删除 ${record.name} 吗？`}>
                    <Button type="link">删除</Button>
                  </Popconfirm>
                )}
              </Space>
            )}
          />
        </Table>
      </SortableContext>
    </DndContext>
  );
}
