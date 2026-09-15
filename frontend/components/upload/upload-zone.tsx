"use client";

import { useCallback, useState } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadZone({ onFilesSelected, disabled }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [disabled, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      e.target.value = "";
    },
    [onFilesSelected]
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    document.getElementById("file-upload-input")?.click();
  }, [disabled]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-200",
        "cursor-pointer hover:border-primary/50 hover:bg-accent/30",
        isDragOver && "border-primary bg-accent/50 scale-[1.01]",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <input
        id="file-upload-input"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        className="hidden"
        aria-label="Upload business cards"
      />

      <div
        className={cn(
          "mb-4 rounded-full p-3 transition-colors",
          isDragOver ? "bg-primary/10" : "bg-muted"
        )}
      >
        {isDragOver ? (
          <Upload className="h-8 w-8 text-primary" />
        ) : (
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <p className="mb-1 text-sm font-medium">
        {isDragOver ? "Drop your files here" : "Drop business cards here"}
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        or click to browse your files
      </p>
      <p className="text-xs text-muted-foreground">
        JPG, PNG, WEBP &middot; Max 10 MB
      </p>
    </div>
  );
}
