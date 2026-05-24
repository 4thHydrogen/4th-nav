import { useCallback } from "react";
import { fetchDeleteFolder, fetchMoveToolToFolder } from "../../shared/api/folder";
import { fetchAddTool, fetchUpdateTool } from "../../shared/api/tool";
import type { Tool, ToolSize } from "../../types";
import { toUpdateDto } from "./model";

interface UseToolContextMenuActionsOptions {
  tool: Tool;
  onClose: () => void;
  onRefresh?: () => void;
  onViewModeChange: (tool: Tool, nextMode: "icon" | "card") => void;
  onAddToDock: (tool: Tool) => void;
  updateToolSize: { mutate: (payload: { id: number; size: ToolSize }) => void };
}

export function useToolContextMenuActions({
  tool,
  onClose,
  onRefresh,
  onViewModeChange,
  onAddToDock,
  updateToolSize,
}: UseToolContextMenuActionsOptions) {
  const closeAfter = useCallback(() => {
    onRefresh?.();
    onClose();
  }, [onClose, onRefresh]);

  const handleMoveToFolder = useCallback(
    async (folderId: number) => {
      try {
        await fetchMoveToolToFolder(tool.id, folderId);
      } finally {
        closeAfter();
      }
    },
    [closeAfter, tool.id]
  );

  const handleRemoveFromFolder = useCallback(async () => {
    try {
      await fetchMoveToolToFolder(tool.id, null);
    } finally {
      closeAfter();
    }
  }, [closeAfter, tool.id]);

  const handleRename = useCallback(async () => {
    const name = window.prompt("请输入新的名称：", tool.name);
    if (!name?.trim()) {
      return;
    }

    try {
      await fetchUpdateTool({
        ...toUpdateDto(tool),
        id: tool.id,
        name: name.trim(),
      });
    } finally {
      closeAfter();
    }
  }, [closeAfter, tool]);

  const handleDeleteFolder = useCallback(
    async (mode: "move-children-to-root" | "delete-with-children") => {
      try {
        await fetchDeleteFolder(tool.id, mode);
      } finally {
        closeAfter();
      }
    },
    [closeAfter, tool.id]
  );

  const handleSetSize = useCallback(
    (size: ToolSize) => {
      updateToolSize.mutate({ id: tool.id, size });
      onClose();
    },
    [onClose, tool.id, updateToolSize]
  );

  const handleCreateFolder = useCallback(async () => {
    const name = window.prompt("请输入文件夹名称：");
    if (!name?.trim()) {
      return;
    }

    try {
      const folder = await fetchAddTool({
        name: name.trim(),
        url: "",
        logo: "",
        category: tool.category || "",
        description: "",
        sort: 1,
        hide: false,
        viewMode: "icon",
        type: "folder",
        parentId: null,
        size: "1x1",
        folderTint: "",
        gridX: -1,
        gridY: -1,
        folderViewMode: "grid",
        folderItemSize: 28,
      });

      if (folder.id) {
        await fetchMoveToolToFolder(tool.id, folder.id);
      }
    } finally {
      closeAfter();
    }
  }, [closeAfter, tool.category, tool.id]);

  const handleOpenInNewTab = useCallback(() => {
    window.open(tool.url, "_blank");
    onClose();
  }, [onClose, tool.url]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(tool.url);
    onClose();
  }, [onClose, tool.url]);

  const handleAddToDock = useCallback(() => {
    onAddToDock(tool);
    onClose();
  }, [onAddToDock, onClose, tool]);

  const handleToggleViewMode = useCallback(
    (nextMode: "icon" | "card") => {
      onViewModeChange(tool, nextMode);
      onClose();
    },
    [onClose, onViewModeChange, tool]
  );

  return {
    handleMoveToFolder,
    handleRemoveFromFolder,
    handleRename,
    handleDeleteFolder,
    handleSetSize,
    handleCreateFolder,
    handleOpenInNewTab,
    handleCopyUrl,
    handleAddToDock,
    handleToggleViewMode,
  };
}
