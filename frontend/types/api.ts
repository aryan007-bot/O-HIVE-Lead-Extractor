import type { Lead, ExtractionQuality } from "./lead";

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface LeadsResponse {
  items: Lead[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface UploadResult {
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
  extraction_quality?: ExtractionQuality;
  error?: string;
}

export interface UploadResponse {
  total: number;
  successful: number;
  failed: number;
  results: UploadResult[];
}

export interface LeadStatsResponse {
  total: number;
  complete: number;
  partial: number;
  failed: number;
}

export interface LeadFiltersResponse {
  positions: string[];
  locations: string[];
  companies: string[];
}
