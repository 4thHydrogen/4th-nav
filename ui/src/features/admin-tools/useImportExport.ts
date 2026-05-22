import { useCallback } from "react";
import { message } from "antd";
import { fetchImportTools, fetchExportTools } from "../../shared/api/tool";
import type { Tool } from "../../types";

export function useImportExport(reload: () => void) {
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

  return { handleImport, handleExport };
}
