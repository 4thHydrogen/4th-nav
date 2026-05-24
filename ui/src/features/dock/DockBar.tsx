import { useCallback, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { DockItem } from "../../types";
import { fetchRemoveDockItem, fetchUpdateDockSort } from "../../shared/api/dock";
import ToolIcon from "../../shared/ui/ToolIcon";
import "./dock-bar.css";

interface DockBarProps {
  items: DockItem[];
  onChange: () => void;
}

export default function DockBar({ items, onChange }: DockBarProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const hasDragged = useRef(false);

  const handleClick = useCallback((item: DockItem) => {
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }
    window.open(item.url, "_blank");
  }, []);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, item: DockItem) => {
      event.preventDefault();
      event.stopPropagation();
      fetchRemoveDockItem(item.id)
        .then(() => onChange())
        .catch(() => {});
    },
    [onChange]
  );

  const handleDragStart = useCallback((event: React.DragEvent, index: number) => {
    hasDragged.current = true;
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent, index: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent, dropIndex: number) => {
      event.preventDefault();
      if (dragIndex === null || dragIndex === dropIndex) {
        handleDragEnd();
        return;
      }

      const newItems = [...items];
      const [moved] = newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, moved);

      const updates = newItems.map((item, index) => ({ id: item.id, sort: index }));
      try {
        await fetchUpdateDockSort(updates);
        onChange();
      } catch {
        onChange();
      } finally {
        handleDragEnd();
      }
    },
    [dragIndex, items, onChange, handleDragEnd]
  );

  if (!items || items.length === 0) {
    return (
      <div className="dock-bar dock-empty-hint">
        <span className="dock-empty-icon">
          <Plus size={16} />
        </span>
        <span className="dock-empty-text">右键工具卡片可添加到 Dock</span>
      </div>
    );
  }

  return (
    <div className="dock-bar">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`dock-item${dragIndex === index ? " dragging" : ""}${
            overIndex === index && dragIndex !== index
              ? dragIndex < index
                ? " drag-over-right"
                : " drag-over-left"
              : ""
          }`}
          draggable
          onDragStart={(event) => handleDragStart(event, index)}
          onDragOver={(event) => handleDragOver(event, index)}
          onDragEnd={handleDragEnd}
          onDrop={(event) => handleDrop(event, index)}
          onClick={() => handleClick(item)}
          onContextMenu={(event) => handleContextMenu(event, item)}
        >
          <span className="dock-tooltip">{item.name}</span>
          <ToolIcon logo={item.logo} name={item.name} toolUrl={item.url} size={36} radius={8} />
        </div>
      ))}
    </div>
  );
}
