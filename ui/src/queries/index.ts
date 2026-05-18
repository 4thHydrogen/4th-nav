import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import {
  FetchList,
  fetchUpdateToolViewMode,
  fetchAddDockItem,
  fetchMoveToolToFolder,
  fetchAddTool,
  fetchUpdateLayout,
  fetchUpdateFolderSettings,
} from "../utils/api";
import type { ContentData, ToolViewMode, LayoutItemDto, FolderViewMode } from "../types";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      onError: (err) => {
        console.error("Mutation failed:", err);
      },
    },
  },
});

const contentKey = ["content"] as const;

export function useContentQuery() {
  return useQuery({
    queryKey: contentKey,
    queryFn: async () => {
      return await FetchList();
    },
  });
}

export function useRefreshContent() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: contentKey });
}

export function useUpdateViewMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; viewMode: ToolViewMode }) =>
      fetchUpdateToolViewMode(vars.id, vars.viewMode),
    onMutate: async ({ id, viewMode }) => {
      await qc.cancelQueries({ queryKey: contentKey });
      const prev = qc.getQueryData<ContentData>(contentKey);
      if (prev) {
        qc.setQueryData<ContentData>(contentKey, {
          ...prev,
          tools: prev.tools.map((t) =>
            t.id === id ? { ...t, viewMode } : t
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(contentKey, ctx.prev);
    },
  });
}

export function useAddToDock() {
  const refresh = useRefreshContent();
  return useMutation({
    mutationFn: (toolId: number) => fetchAddDockItem(toolId),
    onSuccess: refresh,
  });
}

export function useMoveToFolder() {
  const refresh = useRefreshContent();
  return useMutation({
    mutationFn: (vars: { toolId: number; folderId: number | null }) =>
      fetchMoveToolToFolder(vars.toolId, vars.folderId),
    onSuccess: refresh,
  });
}

export function useMergeToFolder() {
  const refresh = useRefreshContent();
  return useMutation({
    mutationFn: async (vars: { toolId1: number; toolId2: number; catelog: string }) => {
      const folder = await fetchAddTool({
        name: "新建文件夹",
        url: "",
        logo: "",
        catelog: vars.catelog,
        desc: "",
        sort: 1,
        hide: false,
        viewMode: "icon",
        type: "folder",
        parentId: null,
        size: "1x1",
        bgColor: "",
        gridX: -1,
        gridY: -1,
        folderViewMode: "grid",
        folderItemSize: 28,
      });
      if (folder?.id) {
        await fetchMoveToolToFolder(vars.toolId1, folder.id);
        await fetchMoveToolToFolder(vars.toolId2, folder.id);
      }
    },
    onSuccess: refresh,
  });
}

export function useUpdateLayout() {
  return useMutation({
    mutationFn: (items: LayoutItemDto[]) => fetchUpdateLayout(items),
  });
}

export function useUpdateFolderSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; folderViewMode: FolderViewMode; folderItemSize: number }) =>
      fetchUpdateFolderSettings(vars.id, vars.folderViewMode, vars.folderItemSize),
    onMutate: async ({ id, folderViewMode, folderItemSize }) => {
      await qc.cancelQueries({ queryKey: contentKey });
      const prev = qc.getQueryData<ContentData>(contentKey);
      if (prev) {
        qc.setQueryData<ContentData>(contentKey, {
          ...prev,
          tools: prev.tools.map((t) =>
            t.id === id ? { ...t, folderViewMode, folderItemSize } : t
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(contentKey, ctx.prev);
    },
  });
}
