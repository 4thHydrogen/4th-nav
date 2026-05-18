import { useRef, useEffect } from "react";
import type { FolderViewMode } from "../../types";
import "./index.css";

interface FolderSettingsPopupProps {
  folderViewMode: FolderViewMode;
  folderItemSize: number;
  onViewModeChange: (mode: FolderViewMode) => void;
  onItemSizeChange: (size: number) => void;
  onClose: () => void;
}

const FolderSettingsPopup = ({
  folderViewMode,
  folderItemSize,
  onViewModeChange,
  onItemSizeChange,
  onClose,
}: FolderSettingsPopupProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={ref} className="folder-settings-popup" onClick={(e) => e.stopPropagation()}>
      <div className="folder-settings-section">
        <div className="folder-settings-label">显示模式</div>
        <div className="folder-settings-toggle">
          <button
            className={`folder-settings-btn${folderViewMode === "grid" ? " active" : ""}`}
            onClick={() => onViewModeChange("grid")}
          >
            图标
          </button>
          <button
            className={`folder-settings-btn${folderViewMode === "list" ? " active" : ""}`}
            onClick={() => onViewModeChange("list")}
          >
            列表
          </button>
        </div>
      </div>
      {folderViewMode === "list" && (
        <div className="folder-settings-section">
          <div className="folder-settings-label">条目大小</div>
          <div className="folder-settings-slider-row">
            <span className="folder-settings-slider-hint">紧凑</span>
            <input
              type="range"
              min={20}
              max={48}
              value={folderItemSize}
              onChange={(e) => onItemSizeChange(Number(e.target.value))}
              className="folder-settings-slider"
            />
            <span className="folder-settings-slider-hint">宽松</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderSettingsPopup;
