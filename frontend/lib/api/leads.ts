import { apiClient } from "./client";
import { API_ENDPOINTS } from "@/lib/constants";
import type { LeadsResponse, LeadStatsResponse, LeadFiltersResponse } from "@/types/api";
import type { Lead, LeadUpdatePayload } from "@/types/lead";

export interface LeadQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  quality?: string;
  position?: string;
  location?: string;
  company?: string;
}

export async function getLeads(params?: LeadQueryParams): Promise<LeadsResponse> {
  const queryParams: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams[key] = String(value);
      }
    });
  }
  return apiClient.get<LeadsResponse>(API_ENDPOINTS.leads, { params: queryParams });
}

export async function getLead(id: number): Promise<Lead> {
  return apiClient.get<Lead>(API_ENDPOINTS.lead(id));
}

export async function updateLead(id: number, data: LeadUpdatePayload): Promise<Lead> {
  return apiClient.request<Lead>(API_ENDPOINTS.lead(id), {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

export async function deleteLead(id: number): Promise<void> {
  await apiClient.delete<void>(API_ENDPOINTS.lead(id));
}

export async function deleteLeads(): Promise<void> {
  await apiClient.delete<void>(API_ENDPOINTS.leads);
}

export async function getLeadStats(): Promise<LeadStatsResponse> {
  return apiClient.get<LeadStatsResponse>(API_ENDPOINTS.leadStats);
}

export async function getLeadFilters(): Promise<LeadFiltersResponse> {
  return apiClient.get<LeadFiltersResponse>(API_ENDPOINTS.leadFilters);
}
