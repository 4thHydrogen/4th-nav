import { http } from "./http";
import type { ContentData, Tool } from "../../types";

export const FetchList = async (): Promise<ContentData> => {
    const { data: raw } = await http.get("/api/");
    const { data } = raw;
    const catelogs: string[] = ["全部工具"];
    data.catelogs.forEach((item: { name: string }) => {
        catelogs.push(item.name);
    });
    if (!data.tools) {
        data.tools = [];
    }
    data.tools.forEach((item: Tool) => {
        if (!catelogs.includes(item.catelog)) {
            catelogs.push(item.catelog);
        }
    });
    data.catelogs = catelogs;
    if (!data.dockItems) {
        data.dockItems = [];
    }
    return data;
};
