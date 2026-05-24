import { normalizePublicApiData } from "../../entities/tool/model";
import type { ContentData, PublicApiData } from "../../types";
import { http } from "./http";

export const FetchList = async (): Promise<ContentData> => {
  const { data: raw } = await http.get("/api/");
  return normalizePublicApiData((raw?.data || {}) as PublicApiData);
};
