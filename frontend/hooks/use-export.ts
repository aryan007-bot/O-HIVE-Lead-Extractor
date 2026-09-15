"use client";

import { useState, useCallback } from "react";
import { downloadExcel, type ExportParams } from "@/lib/api/export";
import { toast } from "sonner";

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = useCallback(async (params?: ExportParams) => {
    setIsExporting(true);
    try {
      const blob = await downloadExcel(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ohive-leads-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Excel file downloaded successfully");
    } catch {
      toast.error("Failed to export Excel file. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, exportToExcel };
}
