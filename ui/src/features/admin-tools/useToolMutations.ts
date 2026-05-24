import { useCallback } from "react";
import { message } from "antd";
import type { AddToolDto, UpdateToolDto } from "../../types";
import { fetchAddTool, fetchDeleteTool, fetchUpdateTool } from "../../shared/api/tool";
import type { DataType } from "./DraggableRow";

const normalizeRecord = (record: DataType) => ({
  ...record,
  category: record.category || "",
  description: record.description || "",
  folderTint: record.folderTint || "",
});

export function useToolMutations(reload: () => void) {
  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await fetchDeleteTool(id);
        message.success("删除成功");
      } catch {
        message.warning("删除失败");
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleUpdate = useCallback(
    async (record: DataType) => {
      try {
        await fetchUpdateTool(normalizeRecord(record) as unknown as UpdateToolDto);
        message.success("更新成功，Logo 会在 3 秒后刷新并重新加载", 3);
        setTimeout(() => reload(), 3000);
      } catch {
        message.warning("更新失败");
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleCreate = useCallback(
    async (record: DataType) => {
      try {
        const payload = {
          gridX: -1,
          gridY: -1,
          ...normalizeRecord(record),
        } as unknown as AddToolDto;
        await fetchAddTool(payload);
        message.success("添加成功，Logo 会在 3 秒后刷新并重新加载", 3);
        setTimeout(() => reload(), 3000);
      } catch {
        message.warning("添加失败");
      } finally {
        reload();
      }
    },
    [reload]
  );

  const handleCreateFolder = useCallback(
    async (record: DataType) => {
      const payload = {
        gridX: -1,
        gridY: -1,
        ...normalizeRecord(record),
        type: "folder" as const,
        url: "",
        logo: "",
        parentId: null,
        size: record.size || "1x1",
      };

      try {
        await fetchAddTool(payload as unknown as AddToolDto);
        message.success("文件夹创建成功");
      } catch {
        message.warning("创建失败");
      } finally {
        reload();
      }
    },
    [reload]
  );

  return { handleDelete, handleUpdate, handleCreate, handleCreateFolder };
}
