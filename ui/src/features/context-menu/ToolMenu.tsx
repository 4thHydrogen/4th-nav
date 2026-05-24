import ToolContextMenu from "./index";
import type { Tool, ToolViewMode } from "../../types";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tool: Tool | null;
}

interface ToolMenuProps {
  state: ContextMenuState;
  onClose: () => void;
  onViewModeChange: (tool: Tool, nextMode: ToolViewMode) => void;
  onAddToDock: (tool: Tool) => void;
  isInDock: (toolId: number) => boolean;
  allTools: Tool[];
  onRefresh: () => void;
}

export default function ToolMenu(props: ToolMenuProps) {
  return <ToolContextMenu {...props} />;
}
