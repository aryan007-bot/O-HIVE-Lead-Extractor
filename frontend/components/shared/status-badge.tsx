import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, X, Clock, Loader2 } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
    className: "text-muted-foreground",
  },
  uploading: {
    label: "Uploading",
    variant: "default" as const,
    icon: Loader2,
    className: "text-blue-600 dark:text-blue-400",
  },
  processing: {
    label: "Processing",
    variant: "default" as const,
    icon: Loader2,
    className: "text-blue-600 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    variant: "default" as const,
    icon: Check,
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300",
  },
  failed: {
    label: "Failed",
    variant: "destructive" as const,
    icon: X,
    className: "",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      <Icon
        className={cn(
          "mr-1 h-3 w-3",
          (status === "processing" || status === "uploading") && "animate-spin"
        )}
      />
      {config.label}
    </Badge>
  );
}
