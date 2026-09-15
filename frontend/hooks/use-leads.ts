"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeads, updateLead, deleteLead, deleteLeads, getLeadStats } from "@/lib/api/leads";
import { toast } from "sonner";
import type { LeadUpdatePayload } from "@/types/lead";
import type { LeadQueryParams } from "@/lib/api/leads";
import { useMemo, useState, useCallback } from "react";

export function useLeads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [queryParams, setQueryParams] = useState<LeadQueryParams>({
    page: 1,
    page_size: 50,
  });

  const mergedParams = useMemo<LeadQueryParams>(
    () => ({
      ...queryParams,
      search: search || undefined,
    }),
    [queryParams, search]
  );

  const {
    data: leadsResponse,
    isLoading,
    error,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["leads", mergedParams],
    queryFn: () => getLeads(mergedParams),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["leadStats"],
    queryFn: getLeadStats,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const refetch = useCallback(() => {
    refetchLeads();
    refetchStats();
  }, [refetchLeads, refetchStats]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeadUpdatePayload }) =>
      updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated successfully");
    },
    onError: () => {
      toast.error("Failed to update lead");
    },
  });

  const deleteSingleMutation = useMutation({
    mutationFn: (id: number) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      toast.success("Lead deleted");
    },
    onError: () => {
      toast.error("Failed to delete lead");
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteLeads,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      toast.success("All leads deleted");
    },
    onError: () => {
      toast.error("Failed to delete leads");
    },
  });

  const allLeads = useMemo(() => leadsResponse?.items || [], [leadsResponse]);

  const filteredLeads = useMemo(() => {
    let result = allLeads;

    switch (filter) {
      case "has_email":
        result = result.filter((lead) => lead.email && lead.email.trim() !== "");
        break;
      case "has_phone":
        result = result.filter((lead) => lead.phone && lead.phone.trim() !== "");
        break;
    }

    return result;
  }, [allLeads, filter]);

  const stats = useMemo(() => {
    if (statsData) {
      return {
        total: statsData.total,
        complete: statsData.complete,
        partial: statsData.partial,
        failed: statsData.failed,
        withEmail: allLeads.filter((l) => l.email && l.email.trim() !== "").length,
      };
    }
    return {
      total: allLeads.length,
      complete: 0,
      partial: 0,
      failed: 0,
      withEmail: allLeads.filter((l) => l.email && l.email.trim() !== "").length,
    };
  }, [statsData, allLeads]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setQueryParams((prev) => ({ ...prev, page: 1 }));
  }, []);

  return {
    leads: filteredLeads,
    allLeads,
    stats,
    statsLoading,
    isLoading,
    error,
    search,
    setSearch: handleSearchChange,
    filter,
    setFilter,
    updateLead: updateMutation.mutate,
    deleteLead: deleteSingleMutation.mutate,
    deleteAllLeads: deleteAllMutation.mutate,
    isUpdating: updateMutation.isPending,
    refetch,
  };
}
