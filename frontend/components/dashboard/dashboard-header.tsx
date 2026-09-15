"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { APP_TAGLINE } from "@/lib/constants";

interface DashboardHeaderProps {
  onExtract: () => void;
}

export function DashboardHeader({ onExtract }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Business Card Lead Extraction
        </h1>
        <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
      </div>
      <Button onClick={onExtract}>
        <Plus className="mr-2 h-4 w-4" />
        Extract Leads
      </Button>
    </div>
  );
}
