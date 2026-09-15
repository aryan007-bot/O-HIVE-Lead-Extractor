"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyLeadsProps {
  hasSearch?: boolean;
  onUpload?: () => void;
}

export function EmptyLeads({ hasSearch, onUpload }: EmptyLeadsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      {hasSearch ? (
        <>
          <h3 className="mb-1 text-lg font-semibold">No leads found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </>
      ) : (
        <>
          <h3 className="mb-1 text-lg font-semibold">No leads extracted yet</h3>
          <p className="mb-4 max-w-sm text-sm text-muted-foreground">
            Upload your business cards and let O-HIVE extract structured lead data.
          </p>
          {onUpload && (
            <Button onClick={onUpload}>Upload Business Cards</Button>
          )}
        </>
      )}
    </div>
  );
}
