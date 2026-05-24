import { Button, Input, Popconfirm, Select, Space, Upload } from "antd";
import type { Category } from "../../types";
import { getOptions } from "../../utils/admin";
import type { ToolTableRecord } from "./useToolsTableModel";

interface ToolsToolbarProps {
  categories: Category[];
  selectedRows: ToolTableRecord[];
  onCategoryChange: (name: string) => void;
  onCategoryClear: () => void;
  onSearch: (value: string) => void;
  onAddTool: () => void;
  onAddFolder: () => void;
  onReload: () => void;
  onImport: (tools: unknown) => void;
  onExport: () => void;
  onBulkDelete: () => void;
  onBulkResetLogo: () => void;
  onBulkCacheLogo: () => void;
}

export default function ToolsToolbar({
  categories,
  selectedRows,
  onCategoryChange,
  onCategoryClear,
  onSearch,
  onAddTool,
  onAddFolder,
  onReload,
  onImport,
  onExport,
  onBulkDelete,
  onBulkResetLogo,
  onBulkCacheLogo,
}: ToolsToolbarProps) {
  return (
    <Space wrap>
      {selectedRows.length > 0 && (
        <Popconfirm title="确定删除这些工具吗？" onConfirm={onBulkDelete}>
          <Button type="link">删除所选</Button>
        </Popconfirm>
      )}
      {selectedRows.length > 0 && (
        <Popconfirm
          title="确定重置这些图标吗？系统会自动重新获取默认图标。"
          onConfirm={onBulkResetLogo}
        >
          <Button type="link">重置图标</Button>
        </Popconfirm>
      )}
      {selectedRows.length > 0 && (
        <Popconfirm
          title="确定重建这些图标缓存吗？系统会重新获取并写入缓存。"
          onConfirm={onBulkCacheLogo}
        >
          <Button type="link">重建图标缓存</Button>
        </Popconfirm>
      )}

      <Select
        options={getOptions(categories)}
        placeholder="分类筛选"
        allowClear
        onClear={onCategoryClear}
        onChange={onCategoryChange}
        style={{ minWidth: 160 }}
      />
      <Input.Search allowClear placeholder="搜索名称或描述" onSearch={(value) => onSearch(value.trim())} />
      <Button type="primary" onClick={onAddTool}>
        添加工具
      </Button>
      <Button onClick={onAddFolder}>添加文件夹</Button>
      <Button type="primary" onClick={onReload}>
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
            if (tools) onImport(JSON.parse(tools as string));
          };
          return false;
        }}
      >
        <Button type="primary">导入</Button>
      </Upload>
      <Button type="primary" onClick={onExport}>
        导出
      </Button>
    </Space>
  );
}
