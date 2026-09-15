"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { uploadBusinessCards } from "@/lib/api/upload";
import { validateFiles } from "@/lib/validations/upload";
import type { UploadFile } from "@/types/upload";
import type { BatchProcessingResponse, ProcessingResult } from "@/types/upload";

let fileIdCounter = 0;
function generateFileId(): string {
  return `file-${Date.now()}-${++fileIdCounter}`;
}

export function useUpload() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchProcessingResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
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

      if (response.failed > 0) {
        toast.warning(
          `${response.successful} of ${response.total} cards processed successfully. ${response.failed} card(s) could not be processed.`
        );
      } else {
        toast.success(`All ${response.successful} cards processed successfully.`);
      }
    } catch {
      toast.error("Failed to process cards. Please try again.");
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "failed", error: "Processing failed" }))
      );
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    files,
    isProcessing,
    results,
    fileInputRef,
    addFiles,
    removeFile,
    clearFiles,
    processFiles,
    openFilePicker,
  };
}
