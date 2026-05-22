import { http } from "./http";
import type { AddCategoryDto, UpdateCategoryDto } from "../../types";

export const fetchAddCategory = async (payload: AddCategoryDto) => {
    const { data } = await http.post(`/api/admin/catelog`, payload);
    return data?.data || {};
};

export const fetchUpdateCategory = async (payload: UpdateCategoryDto) => {
    const { data } = await http.put(`/api/admin/catelog/${payload.id}`, payload);
    return data?.data || {};
};

export const fetchDeleteCategory = async (id: number) => {
    const { data } = await http.delete(`/api/admin/catelog/${id}`);
    return data?.data || {};
};

// Legacy aliases for backward compatibility
export const fetchAddCateLog = fetchAddCategory;
export const fetchUpdateCateLog = fetchUpdateCategory;
export const fetchDeleteCatelog = fetchDeleteCategory;
