"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExtractionSummaryProps {
  total: number;
  successful: number;
  failed: number;
}

export function ExtractionSummary({
  total,
  successful,
  failed,
}: ExtractionSummaryProps) {
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Extraction Summary</CardTitle>
          <Badge variant="secondary">{total} cards</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold text-emerald-600">{successful}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {total > 0 ? Math.round((successful / total) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
