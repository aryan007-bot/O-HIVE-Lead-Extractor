"use client";

import { Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessButtonProps {
  count: number;
  isProcessing: boolean;
  onProcess: () => void;
}

export function ProcessButton({ count, isProcessing, onProcess }: ProcessButtonProps) {
  return (
    <Button
      onClick={onProcess}
      disabled={count === 0 || isProcessing}
      className="w-full"
      size="lg"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <ScanLine className="mr-2 h-4 w-4" />
          Process {count} Card{count !== 1 ? "s" : ""}
        </>
      )}
    </Button>
  );
}
