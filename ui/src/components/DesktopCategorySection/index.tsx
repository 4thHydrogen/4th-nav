import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Tool, FolderViewMode } from "../../types";
import ToolItem from "../ToolItem";
import FolderItem from "../FolderItem";
import FolderPopupPanel from "../FolderPopupPanel";
import { useUpdateFolderSettings, useContentQuery } from "../../queries";
import "./index.css";

interface DesktopCategorySectionProps {
  category: string;
  items: Tool[];
  allTools: Tool[];
  isSearching: boolean;
  noImageMode: boolean;
  onToolContextMenu: (e: React.MouseEvent, tool: Tool) => void;
  onToolClick: (tool: Tool) => void;
}

const DesktopCategorySection = ({
  category,
  items,
  allTools,
  isSearching,
  noImageMode,
  onToolContextMenu,
  onToolClick,
}: DesktopCategorySectionProps) => {
  const [expandedFolderId, setExpandedFolderId] = useState<number | null>(null);
  const [popupMousePos, setPopupMousePos] = useState<{ x: number; y: number } | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const updateFolderSettings = useUpdateFolderSettings();
  const { data } = useContentQuery();
  const listItemSize = data?.siteConfig?.folderListItemSize ?? 28;

  const childrenMap = useMemo(() => {
    const map: Record<number, Tool[]> = {};
    allTools.forEach((tool) => {
      if (tool.parentId != null) {
        if (!map[tool.parentId]) map[tool.parentId] = [];
        map[tool.parentId].push(tool);
      }
    });
    return map;
  }, [allTools]);

  const handleFolderClick = useCallback((folderId: number, mouseX: number, mouseY: number) => {
    if (expandedFolderId === folderId) {
      setExpandedFolderId(null);
      setPopupMousePos(null);
    } else {
      setExpandedFolderId(folderId);
      setPopupMousePos({ x: mouseX, y: mouseY });
    }
  }, [expandedFolderId]);

  const handleClosePanel = useCallback(() => {
    setExpandedFolderId(null);
  }, []);

  const handleOpenChildTool = useCallback(
    (tool: Tool) => {
      onToolClick(tool);
      setExpandedFolderId(null);
    },
    [onToolClick]
  );

  const handleUpdateFolderSettings = useCallback(
    (id: number, folderViewMode: FolderViewMode, _folderItemSize: number) => {
      updateFolderSettings.mutate({ id, folderViewMode });
    },
    [updateFolderSettings]
  );

  useEffect(() => {
    if (expandedFolderId == null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedFolderId(null);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setExpandedFolderId(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandedFolderId]);

  const renderItems = () => {
    const elements: React.ReactNode[] = [];

    for (const item of items) {
      if (item.type === "folder") {
        const children = childrenMap[item.id] || [];
        const isExpanded = expandedFolderId === item.id;

        elements.push(
          <div
            key={`folder-${item.id}`}
            style={{ position: "relative", cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              handleFolderClick(item.id, e.clientX, e.clientY);
            }}
          >
            <FolderItem
              folder={item}
              childrenTools={children}
              expanded={isExpanded}
              onClick={() => {}}
              onContextMenu={onToolContextMenu}
            />
            {isExpanded && popupMousePos && (
              <FolderPopupPanel
                folder={item}
                children={children}
                mouseX={popupMousePos.x}
                mouseY={popupMousePos.y}
                listItemSize={listItemSize}
                siteConfig={data?.siteConfig ?? { id: 0, noImageMode, compactMode: false, columnsPerRow: 3, folderListItemSize: listItemSize }}
                onClose={handleClosePanel}
                onOpenTool={handleOpenChildTool}
                onContextMenu={onToolContextMenu}
                onMoveOut={() => {}}
                noImageMode={noImageMode}
              />
            )}
          </div>
        );
      } else {
        elements.push(
          <ToolItem
            key={item.id}
            tool={item}
            index={0}
            isSearching={false}
            noImageMode={noImageMode}
            onContextMenu={onToolContextMenu}
            onClick={() => onToolClick(item)}
          />
        );
      }
    }

    return elements;
  };

  return (
    <section id={`category-${category}`} className="desktop-category-section" ref={sectionRef}>
      <div className="desktop-section-title">{category}</div>
      <div className="desktop-section-grid">
        {renderItems()}
      </div>
    </section>
  );
};

export default DesktopCategorySection;
