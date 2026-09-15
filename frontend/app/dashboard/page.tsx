"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ExtractionSummary } from "@/components/dashboard/extraction-summary";
import { UploadZone } from "@/components/upload/upload-zone";
import { FileList } from "@/components/upload/file-list";
import { ProcessButton } from "@/components/upload/process-button";
import { UploadProgress } from "@/components/upload/upload-progress";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadEditor } from "@/components/leads/lead-editor";
import { ExportButton } from "@/components/export/export-button";
import { ErrorState } from "@/components/shared/error-state";
import { useLeads } from "@/hooks/use-leads";
import { useExport } from "@/hooks/use-export";
import { uploadBusinessCards } from "@/lib/api/upload";
import { validateFiles } from "@/lib/validations/upload";
import type { UploadFile, BatchProcessingResponse, ProcessingResult } from "@/types/upload";
import type { Lead } from "@/types/lead";

let fileIdCounter = 0;
function generateFileId(): string {
  return `file-${Date.now()}-${++fileIdCounter}`;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchProcessingResponse | null>(null);
  const [processingJobs, setProcessingJobs] = useState<
    Array<{ id: string; filename: string; status: "processing" | "completed" | "failed"; timestamp: string }>
  >([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const {
    leads,
    stats,
    isLoading,
    error,
    search,
    setSearch,
    filter,
    setFilter,
    updateLead,
    deleteLead,
    isUpdating,
    refetch,
  } = useLeads();

  const { isExporting, exportToExcel } = useExport();

  const uploadRef = useRef<HTMLDivElement>(null);

  const scrollToUpload = useCallback(() => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const addFiles = useCallback((newFiles: File[]) => {
    const { valid, errors } = validateFiles(newFiles);

    if (errors.length > 0) {
      errors.forEach(({ file, error }) => {
        toast.error(`${file}: ${error}`);
      });
    }

    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.file.name));
      const uniqueNewFiles = valid.filter((f) => !existingNames.has(f.name));

      if (uniqueNewFiles.length < valid.length) {
        const skipped = valid.length - uniqueNewFiles.length;
        toast.warning(`${skipped} duplicate file(s) skipped`);
      }

      const uploadFiles: UploadFile[] = uniqueNewFiles.map((file) => ({
        id: generateFileId(),
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const,
      }));

      return [...prev, ...uploadFiles];
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setResults(null);
  }, [files]);

  const processFiles = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults(null);

    const newJobs = files.map((f) => ({
      id: f.id,
      filename: f.file.name,
      status: "processing" as const,
      timestamp: new Date().toISOString(),
    }));
    setProcessingJobs((prev) => [...newJobs, ...prev]);

    setFiles((prev) =>
      prev.map((f) => ({ ...f, status: "processing" as const }))
    );

    try {
      const rawFiles = files.map((f) => f.file);
      const response = await uploadBusinessCards(rawFiles);

      const mappedResults: ProcessingResult[] = response.results.map((r) => ({
        filename: r.filename,
        status: r.status,
        lead: r.lead,
        lead_id: r.lead_id,
        extraction_quality: r.extraction_quality,
        error: r.error,
      }));

      const batchResults: BatchProcessingResponse = {
        results: mappedResults,
        total: response.total,
        successful: response.successful,
        failed: response.failed,
      };
      setResults(batchResults);

      setFiles((prev) =>
        prev.map((f, index) => {
          const result = response.results[index];
          if (!result) return f;
          return {
            ...f,
            status: result.status === "success" ? "completed" : "failed",
            error: result.error,
            leadId: result.lead_id,
          };
        })
      );

      setProcessingJobs((prev) =>
        prev.map((job) => {
          const result = response.results.find((r) => r.filename === job.filename);
          if (!result) return job;
          return {
            ...job,
            status: result.status === "success" ? "completed" : "failed",
          };
        })
      );

      if (response.failed > 0) {
        toast.warning(
          `${response.successful} of ${response.total} cards processed successfully. ${response.failed} card(s) could not be processed.`
        );
      } else {
        toast.success(`All ${response.successful} cards processed successfully.`);
      }

      refetch();
    } catch {
      toast.error("Failed to process cards. Please try again.");
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "failed", error: "Processing failed" }))
      );
      setProcessingJobs((prev) =>
        prev.map((job) => ({ ...job, status: "failed" }))
      );
    } finally {
      setIsProcessing(false);
    }
  }, [files, refetch]);

  const handleEditLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setEditorOpen(true);
  }, []);

  const handleSaveLead = useCallback(
    (id: number, data: Partial<Lead>) => {
      updateLead({ id, data });
      setEditorOpen(false);
    },
    [updateLead]
  );

  const handleDeleteLead = useCallback(
    (id: number) => {
      deleteLead(id);
    },
    [deleteLead]
  );

  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <AppShell>
        <ErrorState
          message="Failed to load leads data. Please check if the backend is running."
          onRetry={refetch}
        />
      </AppShell>
    );
  }

  const showLeadsView = view === "leads";
  const pendingFiles = files.filter((f) => f.status === "pending");
  const completedCount = files.filter((f) => f.status === "completed").length;
  const failedCount = files.filter((f) => f.status === "failed").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
        {showLeadsView ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
                <p className="text-sm text-muted-foreground">
                  View and manage your extracted leads.
                </p>
              </div>
              <ExportButton
                isExporting={isExporting}
                onExport={() => exportToExcel()}
                disabled={leads.length === 0}
              />
            </div>
            <LeadsTable
              leads={leads}
              isLoading={isLoading}
              search={search}
              onSearchChange={setSearch}
              filter={filter}
              onFilterChange={setFilter}
              onEditLead={handleEditLead}
              onDeleteLead={handleDeleteLead}
            />
          </>
        ) : (
          <>
            <DashboardHeader onExtract={scrollToUpload} />

            <StatsCards
              totalLeads={stats.total}
              withEmail={stats.withEmail}
              sessionJobs={processingJobs.length}
              complete={stats.complete}
              partial={stats.partial}
              failed={stats.failed}
            />

            {results && results.total > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ExtractionSummary
                  total={results.total}
                  successful={results.successful}
                  failed={results.failed}
                />
              </motion.div>
            )}

            <div ref={uploadRef} className="space-y-4">
              <h2 className="text-lg font-semibold">Upload Business Cards</h2>
              <UploadZone onFilesSelected={addFiles} disabled={isProcessing} />

              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Selected Business Cards{" "}
                      <span className="text-muted-foreground">
                        ({files.length} file{files.length !== 1 ? "s" : ""})
                      </span>
                    </p>
                    <button
                      onClick={clearFiles}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  <FileList files={files} onRemove={removeFile} />

                  {isProcessing && (
                    <UploadProgress
                      total={files.length}
                      completed={completedCount}
                      failed={failedCount}
                    />
                  )}

                  <ProcessButton
                    count={pendingFiles.length}
                    isProcessing={isProcessing}
                    onProcess={processFiles}
                  />
                </motion.div>
              )}
            </div>

            {leads.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Extracted Leads</h2>
                  <ExportButton
                    isExporting={isExporting}
                    onExport={() => exportToExcel()}
                  />
                </div>
                <LeadsTable
                  leads={leads}
                  isLoading={isLoading}
                  search={search}
                  onSearchChange={setSearch}
                  filter={filter}
                  onFilterChange={setFilter}
                  onEditLead={handleEditLead}
                  onDeleteLead={handleDeleteLead}
                />
              </div>
            )}

            {leads.length === 0 && !isLoading && files.length === 0 && (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <svg
                    className="h-8 w-8 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-1 text-lg font-semibold">No leads yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Upload your business cards and let O-HIVE extract structured lead data.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <LeadEditor
        lead={selectedLead}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSaveLead}
        isSaving={isUpdating}
      />
    </AppShell>
  );
}
