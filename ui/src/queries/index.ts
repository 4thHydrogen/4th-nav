import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import {
  fetchUpdateToolViewMode,
  fetchAddTool,
  fetchUpdateTool,
} from "../shared/api/tool";
import { FetchList } from "../shared/api/content";
import { fetchAddDockItem } from "../shared/api/dock";
import { fetchMoveToolToFolder, fetchUpdateFolderSettings } from "../shared/api/folder";
import { fetchUpdateLayout } from "../shared/api/tool";
import type { ContentData, ToolViewMode, LayoutItemDto, FolderViewMode, ToolSize } from "../types";

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
    mutationFn: async (vars: { toolId1: number; toolId2: number; catelog: string; gridX: number; gridY: number }) => {
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
        gridX: vars.gridX,
        gridY: vars.gridY,
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
    mutationFn: (vars: { id: number; folderViewMode: FolderViewMode }) =>
      fetchUpdateFolderSettings(vars.id, vars.folderViewMode, 28),
    onMutate: async ({ id, folderViewMode }) => {
      await qc.cancelQueries({ queryKey: contentKey });
      const prev = qc.getQueryData<ContentData>(contentKey);
      if (prev) {
        qc.setQueryData<ContentData>(contentKey, {
          ...prev,
          tools: prev.tools.map((t) =>
            t.id === id ? { ...t, folderViewMode } : t
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

export function useUpdateToolSize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; size: ToolSize }) => {
      const prev = qc.getQueryData<ContentData>(contentKey);
      const tool = prev?.tools.find((t) => t.id === vars.id);
      if (!tool) return Promise.resolve();
      return fetchUpdateTool({ ...tool, size: vars.size });
    },
    onMutate: async ({ id, size }) => {
      await qc.cancelQueries({ queryKey: contentKey });
      const prev = qc.getQueryData<ContentData>(contentKey);
      if (prev) {
        qc.setQueryData<ContentData>(contentKey, {
          ...prev,
          tools: prev.tools.map((t) =>
            t.id === id ? { ...t, size } : t
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
