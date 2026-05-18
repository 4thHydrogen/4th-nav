import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Tool, FolderViewMode } from "../../types";
import ToolItem from "../ToolItem";
import FolderItem from "../FolderItem";
import InlineFolderPanel from "../InlineFolderPanel";
import { useUpdateFolderSettings } from "../../queries";
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
  const sectionRef = useRef<HTMLElement>(null);
  const updateFolderSettings = useUpdateFolderSettings();

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

  const handleFolderClick = useCallback((folderId: number) => {
    setExpandedFolderId((prev) => (prev === folderId ? null : folderId));
  }, []);

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
    (id: number, folderViewMode: FolderViewMode, folderItemSize: number) => {
      updateFolderSettings.mutate({ id, folderViewMode, folderItemSize });
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
          <div key={`folder-${item.id}`} style={{ position: "relative" }}>
            <FolderItem
              folder={item}
              childrenTools={children}
              expanded={isExpanded}
              onClick={() => handleFolderClick(item.id)}
              onContextMenu={onToolContextMenu}
            />
            {isExpanded && (
              <div className="desktop-folder-panel-overlay">
                <InlineFolderPanel
                  folder={item}
                  items={children}
                  noImageMode={noImageMode}
                  onOpenTool={handleOpenChildTool}
                  onClose={handleClosePanel}
                  onUpdateFolderSettings={handleUpdateFolderSettings}
                />
              </div>
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
