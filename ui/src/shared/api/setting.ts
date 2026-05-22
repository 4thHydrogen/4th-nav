import { http } from "./http";
import type { UpdateUserDto } from "../../types";

export const fetchUpdateSetting = async (payload: Record<string, unknown>) => {
    const { data } = await http.put(`/api/admin/setting`, payload);
    return data?.data || {};
};

export const fetchUpdateSiteConfig = async (payload: Record<string, unknown>) => {
    const { data } = await http.put(`/api/admin/siteConfig`, payload);
    return data?.data || {};
};

export const fetchUpdateUser = async (payload: UpdateUserDto) => {
    const { data } = await http.put(`/api/admin/user`, payload);
    return data?.data || {};
};

export const fetchAddApiToken = async (payload: import("../../types").AddTokenDto) => {
    const { data } = await http.post(`/api/admin/apiToken`, payload);
    return data?.data || {};
};

export const fetchDeleteApiToken = async (id: number) => {
    const { data } = await http.delete(`/api/admin/apiToken/${id}`);
    return data?.data || {};
};
