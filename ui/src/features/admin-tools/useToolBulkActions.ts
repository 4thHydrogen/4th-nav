import { useCallback } from "react";
import { message } from "antd";
import { fetchDeleteTool, fetchUpdateTool } from "../../shared/api/tool";
import type { UpdateToolDto } from "../../types";
import type { DataType } from "../../pages/admin/tabs/Tools/DraggableRow";

export function useToolBulkActions(
  reload: () => void,
  selectedRows: DataType[]
) {
  const handleBulkDelete = useCallback(async () => {
    try {
      for (const each of selectedRows) {
        try {
          await fetchDeleteTool(each.id);
        } catch {}
      }
      message.success("删除成功!");
    } catch {
      message.warning("删除失败!");
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
      message.warning("重置失败!");
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
      message.success("缓存成功!");
    } catch {
      message.warning("缓存失败!");
    } finally {
      reload();
    }
  }, [reload, selectedRows]);

  return { handleBulkDelete, handleBulkResetLogo, handleBulkCacheLogo };
}
