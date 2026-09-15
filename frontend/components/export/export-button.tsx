"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  isExporting: boolean;
  onExport: () => void;
  disabled?: boolean;
}

export function ExportButton({ isExporting, onExport, disabled }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onExport}
      disabled={isExporting || disabled}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparing Excel...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </>
      )}
    </Button>
  );
}
