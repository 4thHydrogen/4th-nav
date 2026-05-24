import { useCallback } from "react";
import type { Tool } from "../../types";

interface UseHomeActionsParams {
  openContextMenu: (clientX: number, clientY: number, tool: Tool) => void;
  updateViewMode: { mutate: (vars: { id: number; viewMode: "icon" | "card" }) => void };
  dockItems: { toolId: number }[] | undefined;
  moveToFolder: { mutate: (vars: { toolId: number; folderId: number | null }) => void };
  setSearchValue: (value: string) => void;
  handleSetSearch: (value: string) => void;
  mergeToFolder: {
    mutate: (vars: {
      toolId1: number;
      toolId2: number;
      category: string;
      gridX: number;
      gridY: number;
    }) => void;
  };
  tools: Tool[] | undefined;
}

export function useHomeActions({
  openContextMenu,
  updateViewMode,
  dockItems,
  moveToFolder,
  setSearchValue,
  handleSetSearch,
  mergeToFolder,
  tools,
}: UseHomeActionsParams) {
  const handleContextMenu = useCallback(
    (event: React.MouseEvent, tool: Tool) => {
      event.preventDefault();
      openContextMenu(event.clientX, event.clientY, tool);
    },
    [openContextMenu]
  );

  const handleViewModeChange = useCallback(
    (tool: Tool, nextMode: "icon" | "card") => {
      updateViewMode.mutate({ id: tool.id, viewMode: nextMode });
    },
    [updateViewMode]
  );

  const isInDock = useCallback(
    (toolId: number) => dockItems?.some((item) => item.toolId === toolId) ?? false,
    [dockItems]
  );

  const handleMoveOutOfFolder = useCallback(
    (toolId: number) => {
      moveToFolder.mutate({ toolId, folderId: null });
    },
    [moveToFolder]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      handleSetSearch(value);
    },
    [handleSetSearch, setSearchValue]
  );

  const handleMergeToFolder = useCallback(
    (
      toolId1: number,
      toolId2: number,
      pos1: { x: number; y: number },
      pos2: { x: number; y: number }
    ) => {
      const firstTool = tools?.find((tool) => tool.id === toolId1);
      const secondTool = tools?.find((tool) => tool.id === toolId2);
      if (!firstTool || !secondTool) {
        return;
      }

      const earlier =
        pos1.y < pos2.y || (pos1.y === pos2.y && pos1.x < pos2.x) ? pos1 : pos2;

      mergeToFolder.mutate({
        toolId1,
        toolId2,
        category: firstTool.category || secondTool.category || "",
        gridX: earlier.x,
        gridY: earlier.y,
      });
    },
    [tools, mergeToFolder]
  );

  return {
    handleContextMenu,
    handleViewModeChange,
    isInDock,
    handleMoveOutOfFolder,
    handleSearchChange,
    handleMergeToFolder,
  };
}
