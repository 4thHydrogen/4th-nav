import { http } from "./http";
import type { SearchEngine, SortUpdateDto } from "../../types";

export const fetchGetAllSearchEngines = async (): Promise<SearchEngine[]> => {
    const { data } = await http.get(`/api/admin/searchEngine`);
    return data?.data || [];
};

export const fetchGetEnabledSearchEngines = async (): Promise<SearchEngine[]> => {
    const { data } = await http.get(`/api/searchEngines`);
    return data?.data || [];
};

export const fetchAddSearchEngine = async (payload: Omit<SearchEngine, 'id'>) => {
    const { data } = await http.post(`/api/admin/searchEngine`, payload);
    return data?.data || {};
};

export const fetchUpdateSearchEngine = async (payload: SearchEngine) => {
    const { data } = await http.put(`/api/admin/searchEngine/${payload.id}`, payload);
    return data?.data || {};
};

export const fetchDeleteSearchEngine = async (id: number) => {
    const { data } = await http.delete(`/api/admin/searchEngine/${id}`);
    return data?.data || {};
};

export const fetchUpdateSearchEnginesSort = async (updates: SortUpdateDto[]) => {
    const { data } = await http.put(`/api/admin/searchEngines/sort`, updates);
    return data?.data || {};
};
