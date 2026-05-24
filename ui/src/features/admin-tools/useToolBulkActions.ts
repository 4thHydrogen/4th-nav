import { useCallback } from "react";
import { message } from "antd";
import type { UpdateToolDto } from "../../types";
import { fetchDeleteTool, fetchUpdateTool } from "../../shared/api/tool";
import type { DataType } from "./DraggableRow";

const normalizeRecord = (record: DataType) => ({
  ...record,
  category: record.category || "",
  description: record.description || "",
  folderTint: record.folderTint || "",
});

export function useToolBulkActions(
  reload: () => void,
  selectedRows: DataType[]
) {
  const handleBulkDelete = useCallback(async () => {
    try {
      for (const row of selectedRows) {
        try {
          await fetchDeleteTool(row.id);
        } catch {}
      }
      message.success("删除成功");
    } catch {
      message.warning("删除失败");
    } finally {
      reload();
    }
  }, [reload, selectedRows]);

  const handleBulkResetLogo = useCallback(async () => {
    try {
      for (const row of selectedRows) {
        try {
          await fetchUpdateTool({
            ...normalizeRecord(row),
            logo: "",
          } as unknown as UpdateToolDto);
        } catch {}
      }
      message.success("重置成功");
    } catch {
      message.warning("重置失败");
    } finally {
      reload();
    }
  }, [reload, selectedRows]);

  const handleBulkCacheLogo = useCallback(async () => {
    try {
      for (const row of selectedRows) {
        try {
          await fetchUpdateTool(normalizeRecord(row) as unknown as UpdateToolDto);
        } catch {}
      }
      message.success("缓存成功");
    } catch {
      message.warning("缓存失败");
    } finally {
      reload();
    }
  }, [reload, selectedRows]);

  return { handleBulkDelete, handleBulkResetLogo, handleBulkCacheLogo };
}
