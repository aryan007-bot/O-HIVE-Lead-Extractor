export type LeadStatus = "processing" | "extracted" | "reviewed" | "edited" | "failed";
export type ExtractionQuality = "complete" | "partial" | "failed";

export interface Lead {
  id: number;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  company: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  extraction_quality: ExtractionQuality;
  source_filename: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadUpdatePayload {
  first_name?: string | null;
  last_name?: string | null;
  position?: string | null;
  company?: string | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
}

export type LeadFilter = "all" | "successful" | "failed" | "has_email" | "has_phone";
