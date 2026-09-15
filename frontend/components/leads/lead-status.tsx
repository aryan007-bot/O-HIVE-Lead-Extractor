"use client";

import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Loader2 } from "lucide-react";

interface LeadStatusProps {
  status: "pending" | "processing" | "completed" | "failed";
}

export function LeadStatus({ status }: LeadStatusProps) {
  const config = {
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-secondary text-secondary-foreground",
    },
    processing: {
      label: "Processing",
      icon: Loader2,
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    completed: {
      label: "Extracted",
      icon: Check,
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    },
    failed: {
      label: "Failed",
      icon: X,
      className: "bg-destructive/10 text-destructive",
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge variant="secondary" className={className}>
      <Icon
        className={`mr-1 h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`}
      />
      {label}
    </Badge>
  );
}
