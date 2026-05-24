import React from "react";
import { Card, Spin } from "antd";
import ToolFormModal from "../../../../features/admin-tools/ToolFormModal";
import ToolsTable from "../../../../features/admin-tools/ToolsTable";
import ToolsToolbar from "../../../../features/admin-tools/ToolsToolbar";
import { useToolsTableModel } from "../../../../features/admin-tools/useToolsTableModel";
import { useData } from "../../hooks/useData";

export interface ToolsProps {}

export const Tools: React.FC<ToolsProps> = () => {
  const { store, loading, reload } = useData();

  const model = useToolsTableModel({
    tools: store?.tools || [],
    categories: store?.categories || [],
    reload,
  });

  return (
    <Card
      title={`当前共 ${store?.tools?.length ?? 0} 条`}
      extra={
        <ToolsToolbar
          categories={model.categories}
          selectedRows={model.selectedRows}
          onCategoryChange={model.setCategoryName}
          onCategoryClear={() => model.setCategoryName("")}
          onSearch={model.setSearchString}
          onAddTool={model.openAddTool}
          onAddFolder={model.openAddFolder}
          onReload={reload}
          onImport={model.handleImport}
          onExport={model.handleExport}
          onBulkDelete={model.handleBulkDelete}
          onBulkResetLogo={model.handleBulkResetLogo}
          onBulkCacheLogo={model.handleBulkCacheLogo}
        />
      }
    >
      <Spin spinning={loading}>
        <ToolsTable
          dataSource={model.dataSource}
          categories={model.categories}
          normalizedTools={model.normalizedTools}
          selectedRows={model.selectedRows}
          onSelectRows={model.setSelectedRows}
          onDragEnd={model.onDragEnd}
          onEdit={model.openEdit}
          onDelete={model.handleDelete}
        />
      </Spin>

      <ToolFormModal
        open={model.showAddTool}
        mode="add"
        loading={model.requestLoading}
        form={model.addForm}
        categories={model.categories}
        existingTools={model.normalizedTools}
        onOk={model.submitCreate}
        onCancel={model.closeAddTool}
        afterClose={() => model.addForm.resetFields()}
      />

      <ToolFormModal
        open={model.showEdit}
        mode="edit"
        loading={model.requestLoading}
        form={model.updateForm}
        categories={model.categories}
        existingTools={model.normalizedTools}
        onOk={model.submitUpdate}
        onCancel={model.closeEdit}
      />

      <ToolFormModal
        open={model.showAddFolder}
        mode="add"
        loading={model.requestLoading}
        form={model.addFolderForm}
        categories={model.categories}
        existingTools={model.normalizedTools}
        onOk={model.submitCreateFolder}
        onCancel={model.closeAddFolder}
        afterClose={() => model.addFolderForm.resetFields()}
      />
    </Card>
  );
};

export default Tools;
