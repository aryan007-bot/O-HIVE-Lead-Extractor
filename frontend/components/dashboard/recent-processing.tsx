"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, X } from "lucide-react";

interface ProcessingJob {
  id: string;
  filename: string;
  status: "processing" | "completed" | "failed";
  timestamp: string;
}

interface RecentProcessingProps {
  jobs: ProcessingJob[];
}

export function RecentProcessing({ jobs }: RecentProcessingProps) {
  if (jobs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Processing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs.slice(0, 5).map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                {job.status === "completed" && (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
                {job.status === "failed" && (
                  <X className="h-4 w-4 text-destructive" />
                )}
                {job.status === "processing" && (
                  <Clock className="h-4 w-4 animate-pulse text-blue-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{job.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(job.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  job.status === "completed"
                    ? "default"
                    : job.status === "failed"
                    ? "destructive"
                    : "secondary"
                }
              >
                {job.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
