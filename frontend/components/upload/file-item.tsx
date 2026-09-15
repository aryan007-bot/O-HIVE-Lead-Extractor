"use client";

import { X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { UploadFile } from "@/types/upload";

interface FileItemProps {
  file: UploadFile;
  onRemove: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileItem({ file, onRemove }: FileItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent/30">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.preview}
          alt={file.file.name}
          className="h-full w-full object-cover"
        />
        {file.status === "completed" && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/80">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
        {file.status === "failed" && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/80">
            <AlertCircle className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.file.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.file.size)}
          </span>
          {file.status !== "pending" && (
            <StatusBadge status={file.status} />
          )}
        </div>
        {file.error && (
          <p className="mt-0.5 text-xs text-destructive">{file.error}</p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.file.name}`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
