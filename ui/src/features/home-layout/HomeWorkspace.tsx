import PanelGrid from "../panel-grid/PanelGrid";
import { HomeSearchResults } from "./HomeSearchResults";
import { Loading } from "../../shared/ui/Loading";
import CategoryFilter from "./CategoryFilter";
import MobileCategoryMenu from "./MobileCategoryMenu";
import type { Tool } from "../../types";
import type { GridLayoutConfig } from "../../pages/home/useHomeLayoutVars";

interface HomeWorkspaceProps {
  isLoading: boolean;
  isSearching: boolean;
  categories: string[];
  selectedCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  onClearFilters: () => void;
  filteredData: Tool[];
  allTools: Tool[];
  gridTools: Tool[];
  noImageMode: boolean;
  listItemSize: number;
  layoutConfig?: GridLayoutConfig;
  onContextMenu: (event: React.MouseEvent, tool: Tool) => void;
  onResetSearch: () => void;
  onMoveToFolder: (toolId: number, folderId: number) => void;
  onMoveOutOfFolder: (toolId: number) => void;
  onMergeToFolder: (
    toolId1: number,
    toolId2: number,
    pos1: { x: number; y: number },
    pos2: { x: number; y: number }
  ) => void;
}

export function HomeWorkspace({
  isLoading,
  isSearching,
  categories,
  selectedCategories,
  onToggleCategory,
  onClearFilters,
  filteredData,
  allTools,
  gridTools,
  noImageMode,
  listItemSize,
  layoutConfig,
  onContextMenu,
  onResetSearch,
  onMoveToFolder,
  onMoveOutOfFolder,
  onMergeToFolder,
}: HomeWorkspaceProps) {
  return (
    <>
      {!isSearching && (
        <CategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={onToggleCategory}
          onClearFilters={onClearFilters}
        />
      )}
      {!isSearching && (
        <MobileCategoryMenu
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={onToggleCategory}
          onClearFilters={onClearFilters}
        />
      )}

      <section className="desktop-workspace">
        <div className="desktop-content-shell">
          {isLoading ? (
            <div className="desktop-loading-shell" key="loading">
              <Loading />
            </div>
          ) : isSearching ? (
            <HomeSearchResults
              results={filteredData}
              allTools={allTools}
              noImageMode={noImageMode}
              onContextMenu={onContextMenu}
              onResultClick={onResetSearch}
            />
          ) : (
            <PanelGrid
              tools={gridTools}
              allTools={allTools}
              noImageMode={noImageMode}
              listItemSize={listItemSize}
              layoutConfig={layoutConfig}
              onToolClick={() => onResetSearch()}
              onToolContextMenu={onContextMenu}
              onMoveToFolder={onMoveToFolder}
              onMoveOutOfFolder={onMoveOutOfFolder}
              onMergeToFolder={onMergeToFolder}
            />
          )}
        </div>
      </section>
    </>
  );
}
