export interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  error?: string;
  leadId?: number;
}

export interface ProcessingResult {
  filename: string;
  status: "success" | "failed";
  lead?: {
    first_name: string | null;
    last_name: string | null;
    position: string | null;
    company: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
  };
  lead_id?: number;
  extraction_quality?: string;
  error?: string;
}

export interface BatchProcessingResponse {
  results: ProcessingResult[];
  total: number;
  successful: number;
  failed: number;
}
