import { Helmet } from "react-helmet";
import HomeBackground from "../../features/background/HomeBackground";
import ToolMenu from "../../features/context-menu/ToolMenu";
import Dock from "../../features/dock/Dock";
import FloatingActions from "../../features/home-layout/FloatingActions";
import { HomeHero } from "../../features/home-layout/HomeHero";
import { HomeWorkspace } from "../../features/home-layout/HomeWorkspace";
import SettingsButton from "../../features/settings/SettingsButton";
import "./home-page.css";
import { useHomeActions } from "./useHomeActions";
import { useHomePageModel } from "./useHomePageModel";

export default function HomePage() {
  const model = useHomePageModel();
  const actions = useHomeActions({
    openContextMenu: model.openContextMenu,
    updateViewMode: model.updateViewMode,
    dockItems: model.data?.dockItems,
    moveToFolder: model.moveToFolder,
    setSearchValue: model.setSearchValue,
    handleSetSearch: model.handleSetSearch,
    mergeToFolder: model.mergeToFolder,
    tools: model.data?.tools,
  });

  return (
    <>
      <HomeBackground
        setting={model.data?.setting}
        refreshKey={model.bgRefreshKey}
        onAutoRefreshStateChange={model.onAutoRefreshStateChange}
      />
      <Helmet>
        <meta charSet="utf-8" />
        <link rel="icon" href={model.data?.setting?.favicon ?? "favicon.ico"} />
        <title>{model.data?.setting?.title ?? "4th Nav"}</title>
      </Helmet>

      <main className="desktop-page">
        <HomeHero
          searchValue={model.searchValue}
          onSearchValueChange={actions.handleSearchChange}
          onSelectedEngineChange={model.setSelectedEngine}
        />

        <SettingsButton />

        <HomeWorkspace
          isLoading={model.isLoading}
          isSearching={model.isSearching}
          categories={model.categories}
          selectedCategories={model.selectedCategories}
          onToggleCategory={model.toggleCategory}
          onClearFilters={model.clearFilters}
          filteredData={model.filteredData}
          allTools={model.allTools}
          gridTools={model.gridTools}
          noImageMode={model.noImageMode}
          listItemSize={model.data?.siteConfig?.folderListItemSize ?? 28}
          layoutConfig={model.layoutConfig}
          onContextMenu={actions.handleContextMenu}
          onResetSearch={() => model.resetSearch()}
          onMoveToFolder={(toolId, folderId) =>
            model.moveToFolder.mutate({ toolId, folderId })
          }
          onMoveOutOfFolder={actions.handleMoveOutOfFolder}
          onMergeToFolder={actions.handleMergeToFolder}
        />

        <Dock items={model.data?.dockItems ?? []} onChange={model.refreshContent} />
      </main>

      <ToolMenu
        state={model.contextMenu}
        onClose={model.closeContextMenu}
        onViewModeChange={actions.handleViewModeChange}
        onAddToDock={(tool) => model.addToDock.mutate(tool.id)}
        isInDock={actions.isInDock}
        allTools={model.allTools}
        onRefresh={model.refreshContent}
      />

      <div className="record-wraper">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer">
          {model.data?.setting?.govRecord ?? ""}
        </a>
      </div>
      <FloatingActions
        showGithub={model.showGithub}
        theme={model.theme}
        onThemeSwitch={model.handleThemeSwitch}
        showRefresh={model.showRefresh}
        onRefresh={model.handleRefreshBg}
        isRefreshing={model.isRefreshingBg}
        refreshStatus={model.bgRefreshStatus}
        refreshMessage={model.bgRefreshMessage}
      />
    </>
  );
}
