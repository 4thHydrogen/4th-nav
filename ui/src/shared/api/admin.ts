import { http } from "./http";
import type { AdminApiData } from "../../types";

export const fetchAdminData = async (): Promise<AdminApiData> => {
  const { data } = await http.get("/api/admin/all");
  return data?.data || {};
};
