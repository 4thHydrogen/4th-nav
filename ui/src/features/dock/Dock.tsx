import DockBar from "./DockBar";
import type { DockItem } from "../../types";

interface DockProps {
  items: DockItem[];
  onChange: () => void;
}

export default function Dock({ items, onChange }: DockProps) {
  return <DockBar items={items} onChange={onChange} />;
}
