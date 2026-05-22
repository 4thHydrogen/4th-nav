import { http } from "./http";
import type { AddCatelogDto, UpdateCatelogDto } from "../../types";

export const fetchAddCateLog = async (payload: AddCatelogDto) => {
    const { data } = await http.post(`/api/admin/catelog`, payload);
    return data?.data || {};
};

export const fetchUpdateCateLog = async (payload: UpdateCatelogDto) => {
    const { data } = await http.put(`/api/admin/catelog/${payload.id}`, payload);
    return data?.data || {};
};

export const fetchDeleteCatelog = async (id: number) => {
    const { data } = await http.delete(`/api/admin/catelog/${id}`);
    return data?.data || {};
};
