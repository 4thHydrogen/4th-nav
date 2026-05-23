import { useState, useCallback, useMemo, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { Tool } from "../../types";
import ToolItem from "../ToolItem";
import FolderItem from "../FolderItem";
import FolderFloatingWindow from "../FolderFloatingWindow";
import { useContentQuery } from "../../queries";
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
  const [folderCardRect, setFolderCardRect] = useState<DOMRect | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
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

  const handleFolderClick = useCallback(
    (folderId: number, e: React.MouseEvent) => {
      if (expandedFolderId === folderId) {
        setExpandedFolderId(null);
        setFolderCardRect(null);
      } else {
        const el = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setFolderCardRect(el);
        setExpandedFolderId(folderId);
      }
    },
    [expandedFolderId],
  );

  const handleClosePanel = useCallback(() => {
    setExpandedFolderId(null);
    setFolderCardRect(null);
  }, []);

  const handleOpenChildTool = useCallback(
    (tool: Tool) => {
      onToolClick(tool);
      setExpandedFolderId(null);
      setFolderCardRect(null);
    },
    [onToolClick],
  );

  const expandedFolder = expandedFolderId != null
    ? items.find((t) => t.id === expandedFolderId)
    : null;
  const expandedChildren = expandedFolderId != null
    ? (childrenMap[expandedFolderId] ?? [])
    : [];

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
              handleFolderClick(item.id, e);
            }}
          >
            <FolderItem
              folder={item}
              childrenTools={children}
              expanded={isExpanded}
              onClick={() => {}}
              onContextMenu={onToolContextMenu}
            />
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

      <AnimatePresence>
        {expandedFolder && (
          <FolderFloatingWindow
            key={expandedFolder.id}
            folder={expandedFolder}
            children={expandedChildren}
            listItemSize={listItemSize}
            folderCardRect={folderCardRect}
            onClose={handleClosePanel}
            onOpenTool={handleOpenChildTool}
            onContextMenu={onToolContextMenu}
            onMoveOut={() => {}}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default DesktopCategorySection;
