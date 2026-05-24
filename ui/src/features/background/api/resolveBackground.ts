import { http } from "../../../shared/api/http";
import type { ApiResponse } from "../../../shared/api/http";

export interface ResolvedBackground {
  localUrl: string;
  originalUrl: string;
  photographer: string;
  photographerUrl: string;
  photoPageUrl: string;
  avgColor: string;
}

export const fetchCurrentBackground = async (
  theme: string
): Promise<ResolvedBackground | null> => {
  const { data } = await http.get<ApiResponse<ResolvedBackground | null>>(
    "/api/background/current",
    { params: { theme } }
  );
  return data?.data ?? null;
};

export const refreshBackground = async (
  source?: string,
  theme?: string
): Promise<ResolvedBackground> => {
  const { data } = await http.post<ApiResponse<ResolvedBackground>>(
    "/api/admin/background/refresh",
    { source, theme }
  );
  if (!data?.success || !data?.data) {
    throw new Error(data?.errorMessage ?? "Failed to refresh background");
  }
  return data.data;
};

export const clearBackgroundCache = async (): Promise<void> => {
  await http.post("/api/admin/background/cache/clear");
};

export const testPexelsKey = async (key: string): Promise<void> => {
  const { data } = await http.post<ApiResponse<null>>(
    "/api/admin/background/test-key",
    { key }
  );
  if (!data?.success) {
    throw new Error(data?.errorMessage ?? "API Key 无效");
  }
};
