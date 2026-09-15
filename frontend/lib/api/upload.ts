import { apiClient } from "./client";
import { API_ENDPOINTS } from "@/lib/constants";
import type { UploadResponse } from "@/types/api";

export async function uploadBusinessCards(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  return apiClient.post<UploadResponse>(API_ENDPOINTS.upload, formData);
}
