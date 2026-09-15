"use client";

import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  total: number;
  completed: number;
  failed: number;
}

export function UploadProgress({ total, completed, failed }: UploadProgressProps) {
  const processed = completed + failed;
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Processing business cards...
        </span>
        <span className="font-medium">
          {processed} / {total}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="flex gap-4 text-xs text-muted-foreground">
        {completed > 0 && (
          <span className="text-emerald-600">{completed} succeeded</span>
        )}
        {failed > 0 && (
          <span className="text-destructive">{failed} failed</span>
        )}
      </div>
    </div>
  );
}
