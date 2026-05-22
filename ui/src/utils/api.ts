// Backward-compatible re-exports from shared/api modules
// New code should import directly from shared/api/*

export { FetchList } from "../shared/api/content";
export { login } from "../shared/api/auth";
export {
    fetchAdminData,
    fetchImportTools,
    fetchExportTools,
    fetchDeleteTool,
    fetchUpdateTool,
    fetchAddTool,
    fetchUpdateToolsSort,
    fetchUpdateToolViewMode,
    fetchUpdateLayout,
} from "../shared/api/tool";
export {
    fetchAddCateLog,
    fetchUpdateCateLog,
    fetchDeleteCatelog,
} from "../shared/api/category";
export {
    fetchUpdateSetting,
    fetchUpdateSiteConfig,
    fetchUpdateUser,
    fetchAddApiToken,
    fetchDeleteApiToken,
} from "../shared/api/setting";
export {
    fetchGetAllSearchEngines,
    fetchGetEnabledSearchEngines,
    fetchAddSearchEngine,
    fetchUpdateSearchEngine,
    fetchDeleteSearchEngine,
    fetchUpdateSearchEnginesSort,
} from "../shared/api/search-engine";
export {
    fetchAddDockItem,
    fetchRemoveDockItem,
    fetchUpdateDockSort,
} from "../shared/api/dock";
export {
    fetchMoveToolToFolder,
    fetchDeleteFolder,
    fetchUpdateFolderSettings,
} from "../shared/api/folder";
