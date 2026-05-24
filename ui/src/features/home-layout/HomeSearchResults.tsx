import ToolItem from "../../entities/tool/ui/ToolItem";
import type { Tool } from "../../types";

interface HomeSearchResultsProps {
  results: Tool[];
  allTools: Tool[];
  noImageMode: boolean;
  onContextMenu: (event: React.MouseEvent, tool: Tool) => void;
  onResultClick: () => void;
}

function SearchEmptyState() {
  return (
    <div className="search-empty-state">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.3 }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <div className="search-empty-text">没有找到匹配的工具</div>
      <div className="search-empty-hint">试试别的关键词</div>
    </div>
  );
}

export function HomeSearchResults({
  results,
  allTools,
  noImageMode,
  onContextMenu,
  onResultClick,
}: HomeSearchResultsProps) {
  if (results.length === 0) {
    return <SearchEmptyState />;
  }

  return (
    <div className="desktop-tool-grid desktop-tool-grid-flat">
      {results.map((tool, index) => {
        const parentFolder =
          tool.parentId != null
            ? allTools.find((item) => item.id === tool.parentId)
            : null;

        return (
          <div key={tool.id} className="search-result-cell">
            <ToolItem
              tool={tool}
              index={index}
              isSearching
              noImageMode={noImageMode}
              onContextMenu={onContextMenu}
              onClick={onResultClick}
            />
            {parentFolder && (
              <div className="search-folder-label">位于：{parentFolder.name}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
