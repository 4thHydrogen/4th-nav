import { Form, message } from "antd";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchUpdateToolsSort } from "../../shared/api/tool";
import type { Category, Tool } from "../../types";
import { mutiSearch } from "../../utils/admin";
import { useImportExport } from "./useImportExport";
import { useToolBulkActions } from "./useToolBulkActions";
import { useToolMutations } from "./useToolMutations";

export interface ToolTableRecord extends Tool {}

const normalizeToolRecord = (tool: Tool): ToolTableRecord => ({
  ...tool,
  category: tool.category || "",
  description: tool.description || "",
  folderTint: tool.folderTint || "",
});

interface UseToolsTableModelOptions {
  tools: Tool[];
  categories: Category[];
  reload: () => void;
}

export function useToolsTableModel({ tools, categories, reload }: UseToolsTableModelOptions) {
  const [showEdit, setShowEdit] = useState(false);
  const [showAddTool, setShowAddTool] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [searchString, setSearchString] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [selectedRows, setSelectedRows] = useState<ToolTableRecord[]>([]);
  const [dataSource, setDataSource] = useState<ToolTableRecord[]>([]);

  const [addForm] = Form.useForm();
  const [addFolderForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const normalizedTools = useMemo(() => tools.map(normalizeToolRecord), [tools]);

  const { handleDelete, handleUpdate, handleCreate, handleCreateFolder } = useToolMutations(reload);
  const { handleBulkDelete, handleBulkResetLogo, handleBulkCacheLogo } = useToolBulkActions(reload, selectedRows);
  const { handleImport, handleExport } = useImportExport(reload);

  useEffect(() => {
    const filteredData = normalizedTools
      .filter((item) => {
        const matchedSearch =
          searchString === "" ||
          mutiSearch(item.name, searchString) ||
          mutiSearch(item.description || "", searchString);

        if (!matchedSearch) return false;
        if (!categoryName) return true;
        return mutiSearch(item.category || "", categoryName);
      })
      .sort((a, b) => a.sort - b.sort);

    setDataSource(filteredData);
  }, [categoryName, normalizedTools, searchString]);

  const runWithLoading = useCallback(async (runner: () => Promise<void>) => {
    setRequestLoading(true);
    try {
      await runner();
    } finally {
      setRequestLoading(false);
    }
  }, []);

  const openAddTool = useCallback(() => {
    addForm.resetFields();
    setShowAddTool(true);
  }, [addForm]);

  const openAddFolder = useCallback(() => {
    addFolderForm.resetFields();
    addFolderForm.setFieldsValue({ type: "folder", sort: 1, hide: false, size: "1x1" });
    setShowAddFolder(true);
  }, [addFolderForm]);

  const openEdit = useCallback(
    (record: ToolTableRecord) => {
      updateForm.setFieldsValue(record);
      setShowEdit(true);
    },
    [updateForm]
  );

  const closeAddTool = useCallback(() => {
    setShowAddTool(false);
    addForm.resetFields();
  }, [addForm]);

  const closeAddFolder = useCallback(() => {
    setShowAddFolder(false);
    addFolderForm.resetFields();
  }, [addFolderForm]);

  const closeEdit = useCallback(() => {
    setShowEdit(false);
  }, []);

  const submitCreate = useCallback(async () => {
    await runWithLoading(async () => {
      await handleCreate(addForm.getFieldsValue() as ToolTableRecord);
      setShowAddTool(false);
      addForm.resetFields();
    });
  }, [addForm, handleCreate, runWithLoading]);

  const submitCreateFolder = useCallback(async () => {
    await runWithLoading(async () => {
      await handleCreateFolder(addFolderForm.getFieldsValue() as ToolTableRecord);
      setShowAddFolder(false);
      addFolderForm.resetFields();
    });
  }, [addFolderForm, handleCreateFolder, runWithLoading]);

  const submitUpdate = useCallback(async () => {
    await runWithLoading(async () => {
      await handleUpdate(updateForm.getFieldsValue() as ToolTableRecord);
      setShowEdit(false);
    });
  }, [handleUpdate, runWithLoading, updateForm]);

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;

      setDataSource((previous) => {
        const activeIndex = previous.findIndex((item) => item.id.toString() === active.id);
        const overIndex = previous.findIndex((item) => item.id.toString() === over.id);
        const next = arrayMove(previous, activeIndex, overIndex);
        const updates = next.map((item, index) => ({ id: item.id, sort: index + 1 }));

        fetchUpdateToolsSort(updates)
          .then(() => {
            message.success("排序更新成功");
            reload();
          })
          .catch(() => {
            message.error("排序更新失败");
          });

        return next;
      });
    },
    [reload]
  );

  return {
    categories,
    normalizedTools,
    dataSource,
    selectedRows,
    requestLoading,
    searchString,
    categoryName,
    showEdit,
    showAddTool,
    showAddFolder,
    addForm,
    addFolderForm,
    updateForm,
    setSearchString,
    setCategoryName,
    setSelectedRows,
    openAddTool,
    openAddFolder,
    openEdit,
    closeAddTool,
    closeAddFolder,
    closeEdit,
    submitCreate,
    submitCreateFolder,
    submitUpdate,
    handleDelete,
    handleBulkDelete,
    handleBulkResetLogo,
    handleBulkCacheLogo,
    handleImport,
    handleExport,
    onDragEnd,
  };
}
