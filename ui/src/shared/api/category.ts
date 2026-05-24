import { http } from "./http";
import type { AddCategoryDto, UpdateCategoryDto } from "../../types";

export const fetchAddCategory = async (payload: AddCategoryDto) => {
    const { data } = await http.post(`/api/admin/category`, payload);
    return data?.data || {};
};

export const fetchUpdateCategory = async (payload: UpdateCategoryDto) => {
    const { data } = await http.put(`/api/admin/category/${payload.id}`, payload);
    return data?.data || {};
};

export const fetchDeleteCategory = async (id: number) => {
    const { data } = await http.delete(`/api/admin/category/${id}`);
    return data?.data || {};
};
