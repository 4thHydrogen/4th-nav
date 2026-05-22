import { http } from "./http";
import type { Tool, AddToolDto, UpdateToolDto, SortUpdateDto, ToolViewMode, LayoutItemDto } from "../../types";

export const fetchAdminData = async (): Promise<import("../../types").AdminApiData> => {
    const { data } = await http.get("/api/admin/all");
    return data?.data || {};
};

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
