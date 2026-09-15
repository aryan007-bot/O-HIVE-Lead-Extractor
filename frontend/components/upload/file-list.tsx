"use client";

import { FileItem } from "./file-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UploadFile } from "@/types/upload";

interface FileListProps {
  files: UploadFile[];
  onRemove: (id: string) => void;
}

export function FileList({ files, onRemove }: FileListProps) {
  return (
    <ScrollArea className="max-h-[300px]">
      <div className="space-y-2 pr-4">
        {files.map((file) => (
          <FileItem key={file.id} file={file} onRemove={onRemove} />
        ))}
      </div>
    </ScrollArea>
  );
}
