"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter } from "lucide-react";
import { LeadRow } from "./lead-row";
import { EmptyLeads } from "./empty-leads";
import { Skeleton } from "@/components/ui/skeleton";
import type { Lead } from "@/types/lead";

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead?: (id: number) => void;
}

const filterOptions: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Has Email", value: "has_email" },
  { label: "Has Phone", value: "has_phone" },
];

export function LeadsTable({
  leads,
  isLoading,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onEditLead,
  onDeleteLead,
}: LeadsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 sm:w-64"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              {filterOptions.find((f) => f.value === filter)?.label || "Filter"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Badge variant="secondary">
          {leads.length} lead{leads.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {leads.length === 0 ? (
        <EmptyLeads hasSearch={search.length > 0} />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Position</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden lg:table-cell">Contact</TableHead>
                <TableHead className="hidden xl:table-cell">Status</TableHead>
                <TableHead className="hidden xl:table-cell">Quality</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onEdit={() => onEditLead(lead)}
                  onDelete={onDeleteLead ? () => onDeleteLead(lead.id) : undefined}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
