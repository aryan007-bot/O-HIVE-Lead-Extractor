import { apiClient } from "./client";
import { API_ENDPOINTS } from "@/lib/constants";
import { compressImageForUpload } from "@/lib/utils/image-optimizer";
import type { UploadResponse } from "@/types/api";

export async function uploadBusinessCards(files: File[]): Promise<UploadResponse> {
  const optimizedFiles = await Promise.all(
    files.map((file) => compressImageForUpload(file))
  );

  const formData = new FormData();
  optimizedFiles.forEach((file) => {
    formData.append("files", file);
  });

  return apiClient.post<UploadResponse>(API_ENDPOINTS.upload, formData);
}
