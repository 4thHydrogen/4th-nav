import { http } from "./http";
import type { SortUpdateDto } from "../../types";

export const fetchAddDockItem = async (toolId: number) => {
    const { data } = await http.post(`/api/admin/dock`, { toolId });
    return data;
};

export const fetchRemoveDockItem = async (id: number) => {
    const { data } = await http.delete(`/api/admin/dock/${id}`);
    return data;
};

export const fetchUpdateDockSort = async (updates: SortUpdateDto[]) => {
    const { data } = await http.put(`/api/admin/dock/sort`, updates);
    return data?.data || {};
};
