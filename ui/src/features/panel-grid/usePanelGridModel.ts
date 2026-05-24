import { useMemo } from "react";
import type { Tool } from "../../types";
import type { PanelItem } from "../../entities/panel/types";
import { adaptPanelItems } from "../../entities/panel/adapter";

export function usePanelGridModel(tools: Tool[], allTools: Tool[]) {
  const panelItems = useMemo(
    () => adaptPanelItems(tools, allTools),
    [tools, allTools]
  );

  const itemsMap = useMemo(() => {
    const map = new Map<string, PanelItem>();
    panelItems.forEach((item) => map.set(String(item.id), item));
    return map;
  }, [panelItems]);

  return { panelItems, itemsMap };
}
