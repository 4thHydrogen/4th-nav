import { http } from "./http";
import type { FolderViewMode } from "../../types";

export const fetchMoveToolToFolder = async (toolId: number, parentId: number | null) => {
    const { data } = await http.put(`/api/admin/tool/${toolId}/parent`, { parentId });
    return data;
};

export const fetchDeleteFolder = async (folderId: number, mode: "move-children-to-root" | "delete-with-children") => {
    const { data } = await http.delete(`/api/admin/folder/${folderId}?mode=${mode}`);
    return data;
};

export const fetchUpdateFolderSettings = async (id: number, folderViewMode: FolderViewMode, folderItemSize: number) => {
    const { data } = await http.put(`/api/admin/tool/${id}/folderSettings`, { folderViewMode, folderItemSize });
    return data;
};
