import { http } from "./http";
import type { Tool, AddToolDto, UpdateToolDto, SortUpdateDto, ToolViewMode, LayoutItemDto } from "../../types";

export const fetchImportTools = async (payload: Tool[]) => {
    const { data } = await http.post(`/api/admin/importTools`, payload);
    return data?.data || {};
};

export const fetchExportTools = async (): Promise<Tool[]> => {
    const { data } = await http.get(`/api/admin/exportTools`);
    return data?.data;
};

export const fetchDeleteTool = async (id: number) => {
    const { data } = await http.delete(`/api/admin/tool/${id}`);
    return data?.data || {};
};

export const fetchUpdateTool = async (payload: UpdateToolDto) => {
    const { data } = await http.put(`/api/admin/tool/${payload.id}`, payload);
    return data?.data || {};
};

export const fetchAddTool = async (payload: AddToolDto) => {
    const { data } = await http.post(`/api/admin/tool`, payload);
    return data?.data || {};
};

export const fetchUpdateToolsSort = async (updates: SortUpdateDto[]) => {
    const { data } = await http.put(`/api/admin/tools/sort`, updates);
    return data?.data || {};
};

export const fetchUpdateToolViewMode = async (id: number, viewMode: ToolViewMode) => {
    const { data } = await http.put(`/api/admin/tool/${id}/viewMode`, { viewMode });
    return data;
};

export const fetchUpdateLayout = async (items: LayoutItemDto[]) => {
    const { data } = await http.put(`/api/admin/layout`, { items });
    return data;
};

// Icon management
export const fetchRefreshSingleIcon = async (id: number, force = false) => {
    const { data } = await http.post(`/api/admin/tool/${id}/icon/refresh`, { force });
    return data;
};

export const fetchRefreshMissingIcons = async () => {
    const { data } = await http.post(`/api/admin/icons/refresh-missing`);
    return data;
};

export const fetchRefreshAllIcons = async (clearCache = false, force = false) => {
    const { data } = await http.post(`/api/admin/icons/refresh-all`, { clearCache, force });
    return data;
};

export const fetchClearIconCache = async (mode: string = "cache-only") => {
    const { data } = await http.delete(`/api/admin/icons/cache`, { data: { mode } });
    return data;
};

export interface IconJobStatus {
    running: boolean;
    total: number;
    done: number;
    success: number;
    failed: number;
    lastError: string;
}

export const fetchIconJobStatus = async (): Promise<IconJobStatus> => {
    const { data } = await http.get(`/api/admin/icons/status`);
    return data?.data || { running: false, total: 0, done: 0, success: 0, failed: 0, lastError: "" };
};
