import axios from "axios";
import type { ContentData, AdminApiData, Tool, AddToolDto, UpdateToolDto, AddCatelogDto, UpdateCatelogDto, SearchEngine, SortUpdateDto, UpdateUserDto, AddTokenDto, ToolViewMode, DockItem, ToolType, ToolSize, LayoutItemDto, FolderViewMode } from "../types";

axios.interceptors.request.use(
    (config) => {
        // 从localStorage获取token并添加到请求头
        const token = window.localStorage.getItem("_token");
        if (token) {
            config.headers.Authorization = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            window.localStorage.removeItem("_token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);
const baseUrl = "/api/";
// const baseUrl = "https://tools.mereith.com/api/";
export const FetchList = async (): Promise<ContentData> => {
    const { data: raw } = await axios.get(baseUrl);
    const { data } = raw;
    const catelogs: string[] = ["全部工具"];
    data.catelogs.forEach((item: { name: string }) => {
        catelogs.push(item.name);
    });
    if (!data.tools) {
        data.tools = [];
    }
    data.tools.forEach((item: Tool) => {
        if (!catelogs.includes(item.catelog)) {
            catelogs.push(item.catelog);
        }
    });
    data.catelogs = catelogs;
    if (!data.dockItems) {
        data.dockItems = [];
    }
    return data;
};





export const login = async (username: string, password: string) => {
    const { data } = await axios.post("/api/login", {
        name: username,
        password,
    });
    return data;
};

export const fetchAdminData = async (): Promise<AdminApiData> => {
    const { data } = await axios.get("/api/admin/all");
    return data?.data || {};
};
export const fetchImportTools = async (payload: Tool[]) => {
    const { data } = await axios.post(`/api/admin/importTools`, payload);
    return data?.data || {};
};
export const fetchExportTools = async (): Promise<Tool[]> => {
    const { data } = await axios.get(`/api/admin/exportTools`);
    return data?.data;
};
// 工具管理接口：删除、修改、新增
export const fetchDeleteTool = async (id: number) => {
    const { data } = await axios.delete(`/api/admin/tool/${id}`);
    return data?.data || {};
};
export const fetchUpdateTool = async (payload: UpdateToolDto) => {
    const { data } = await axios.put(`/api/admin/tool/${payload.id}`, payload);
    return data?.data || {};
};
export const fetchAddTool = async (payload: AddToolDto) => {
    const { data } = await axios.post(`/api/admin/tool`, payload);
    return data?.data || {};
};
// 分类管理接口；新增、修改、删除
export const fetchAddCateLog = async (payload: AddCatelogDto) => {
    const { data } = await axios.post(`/api/admin/catelog`, payload);
    return data?.data || {};
};
export const fetchUpdateCateLog = async (payload: UpdateCatelogDto) => {
    const { data } = await axios.put(`/api/admin/catelog/${payload.id}`, payload);
    return data?.data || {};
};
export const fetchDeleteCatelog = async (id: number) => {
    const { data } = await axios.delete(`/api/admin/catelog/${id}`);
    return data?.data || {};
};

export const fetchUpdateSetting = async (payload: Record<string, unknown>) => {
    const { data } = await axios.put(`/api/admin/setting`, payload);
    return data?.data || {};
};

export const fetchUpdateSiteConfig = async (payload: Record<string, unknown>) => {
    const { data } = await axios.put(`/api/admin/siteConfig`, payload);
    return data?.data || {};
};

export const fetchUpdateUser = async (payload: UpdateUserDto) => {
    const { data } = await axios.put(`/api/admin/user`, payload);
    return data?.data || {};
};

export const fetchAddApiToken = async (payload: AddTokenDto) => {
    const { data } = await axios.post(`/api/admin/apiToken`, payload);
    return data?.data || {};
};
export const fetchDeleteApiToken = async (id: number) => {
    const { data } = await axios.delete(`/api/admin/apiToken/${id}`);
    return data?.data || {};
};
export const fetchUpdateToolsSort = async (updates: SortUpdateDto[]) => {
    const { data } = await axios.put(`/api/admin/tools/sort`, updates);
    return data?.data || {};
};

export const fetchUpdateToolViewMode = async (id: number, viewMode: ToolViewMode) => {
    const { data } = await axios.put(`/api/admin/tool/${id}/viewMode`, { viewMode });
    return data;
};

// ==================== 搜索引擎管理接口 ====================

// 获取所有搜索引擎（管理员用）
export const fetchGetAllSearchEngines = async (): Promise<SearchEngine[]> => {
    const { data } = await axios.get(`/api/admin/searchEngine`);
    return data?.data || [];
};

// 获取启用的搜索引擎（前端搜索用）
export const fetchGetEnabledSearchEngines = async (): Promise<SearchEngine[]> => {
    const { data } = await axios.get(`/api/searchEngines`);
    return data?.data || [];
};

// 添加搜索引擎
export const fetchAddSearchEngine = async (payload: Omit<SearchEngine, 'id'>) => {
    const { data } = await axios.post(`/api/admin/searchEngine`, payload);
    return data?.data || {};
};

// 更新搜索引擎
export const fetchUpdateSearchEngine = async (payload: SearchEngine) => {
    const { data } = await axios.put(`/api/admin/searchEngine/${payload.id}`, payload);
    return data?.data || {};
};

// 删除搜索引擎
export const fetchDeleteSearchEngine = async (id: number) => {
    const { data } = await axios.delete(`/api/admin/searchEngine/${id}`);
    return data?.data || {};
};

// 更新搜索引擎排序
export const fetchUpdateSearchEnginesSort = async (updates: SortUpdateDto[]) => {
    const { data } = await axios.put(`/api/admin/searchEngines/sort`, updates);
    return data?.data || {};
};

// ==================== Dock 栏管理接口 ====================

export const fetchAddDockItem = async (toolId: number) => {
    const { data } = await axios.post(`/api/admin/dock`, { toolId });
    return data;
};

export const fetchRemoveDockItem = async (id: number) => {
    const { data } = await axios.delete(`/api/admin/dock/${id}`);
    return data;
};

export const fetchUpdateDockSort = async (updates: SortUpdateDto[]) => {
    const { data } = await axios.put(`/api/admin/dock/sort`, updates);
    return data?.data || {};
};

// ==================== 文件夹管理接口 ====================

export const fetchMoveToolToFolder = async (toolId: number, parentId: number | null) => {
    const { data } = await axios.put(`/api/admin/tool/${toolId}/parent`, { parentId });
    return data;
};

export const fetchDeleteFolder = async (folderId: number, mode: "move-children-to-root" | "delete-with-children") => {
    const { data } = await axios.delete(`/api/admin/folder/${folderId}?mode=${mode}`);
    return data;
};

export const fetchUpdateLayout = async (items: LayoutItemDto[]) => {
    const { data } = await axios.put(`/api/admin/layout`, { items });
    return data;
};

export const fetchUpdateFolderSettings = async (id: number, folderViewMode: FolderViewMode, folderItemSize: number) => {
    const { data } = await axios.put(`/api/admin/tool/${id}/folderSettings`, { folderViewMode, folderItemSize });
    return data;
};
