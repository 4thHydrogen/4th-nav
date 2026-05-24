import { useMemo } from "react";
import type { Tool } from "../../types";
import type { GridLayout } from "../grid-layout/model/collision";
import { buildChildrenMap } from "../../entities/panel/adapter";

export function usePanelGridModel(tools: Tool[], allTools: Tool[], layout: GridLayout[]) {
  const toolsMap = useMemo(() => {
    const map = new Map<string, Tool>();
    tools.forEach((tool) => map.set(String(tool.id), tool));
    return map;
  }, [tools]);

  const folderIds = useMemo(
    () => new Set(tools.filter((tool) => tool.type === "folder").map((tool) => String(tool.id))),
    [tools]
  );

  const childrenMap = useMemo(() => buildChildrenMap(allTools), [allTools]);

  const layoutMap = useMemo(() => {
    const map = new Map<string, GridLayout>();
    layout.forEach((item) => map.set(item.i, item));
    return map;
  }, [layout]);

  return { toolsMap, folderIds, childrenMap, layoutMap };
}
