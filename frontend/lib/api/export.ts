import { apiClient } from "./client";
import { API_ENDPOINTS } from "@/lib/constants";

export interface ExportParams {
  quality?: string;
  location?: string;
  company?: string;
  status?: string;
}

export async function downloadExcel(params?: ExportParams): Promise<Blob> {
  const queryParams: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams[key] = String(value);
      }
    });
  }
  return apiClient.download(API_ENDPOINTS.export, { params: queryParams });
}
