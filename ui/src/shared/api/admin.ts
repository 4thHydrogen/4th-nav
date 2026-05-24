import { normalizeAdminApiData } from "../../entities/tool/model";
import type { AdminApiData } from "../../types";
import { http } from "./http";

export const fetchAdminData = async (): Promise<AdminApiData> => {
  const { data } = await http.get("/api/admin/all");
  return normalizeAdminApiData((data?.data || {}) as AdminApiData);
};
