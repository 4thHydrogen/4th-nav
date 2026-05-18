import { getLogoUrl, isInlineSvg } from "../../utils/check";
import { sanitizeSvg } from "../../utils/sanitize";
import type { Tool } from "../../types";
import "./index.css";

const PREVIEW_COUNT = 4;

interface FolderItemProps {
  folder: Tool;
  childrenTools: Tool[];
  expanded: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}

const FolderItem = ({
  folder,
  childrenTools,
  expanded,
  onClick,
  onContextMenu,
}: FolderItemProps) => {
  const previewItems = childrenTools.slice(0, PREVIEW_COUNT);
  const extraCount = Math.max(childrenTools.length - PREVIEW_COUNT, 0);
  const isEmpty = childrenTools.length === 0;

  return (
    <div
      className={`folder-item ${expanded ? "folder-item-expanded" : ""}`}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, folder)}
    >
      <div
        className="folder-preview"
        style={
          folder.bgColor
            ? { backgroundColor: folder.bgColor }
            : undefined
        }
      >
        {isEmpty ? (
          <div className="folder-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
        ) : (
          previewItems.map((child) => {
            if (isInlineSvg(child.logo)) {
              return (
                <span
                  key={child.id}
                  className="folder-preview-icon"
                  dangerouslySetInnerHTML={{ __html: sanitizeSvg(child.logo) }}
                />
              );
            }
            return (
              <img
                key={child.id}
                className="folder-preview-icon"
                src={getLogoUrl(child.logo)}
                alt={child.name}
              />
            );
          })
        )}
        {extraCount > 0 && (
          <span className="folder-extra">+{extraCount}</span>
        )}
      </div>
      <div className="folder-name">{folder.name}</div>
    </div>
  );
};

export default FolderItem;
