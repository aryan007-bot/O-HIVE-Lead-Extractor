"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Mail, Phone } from "lucide-react";
import type { Lead, LeadStatus, ExtractionQuality } from "@/types/lead";

interface LeadRowProps {
  lead: Lead;
  onEdit: () => void;
  onDelete?: () => void;
}

function formatName(lead: Lead): string {
  const parts = [lead.first_name, lead.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "\u2014";
}

function DisplayValue({ value }: { value: string | null }) {
  return <span>{value && value.trim() !== "" ? value : "\u2014"}</span>;
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const variants: Record<LeadStatus, "default" | "secondary" | "destructive" | "outline"> = {
    processing: "outline",
    extracted: "default",
    reviewed: "secondary",
    edited: "default",
    failed: "destructive",
  };

  return (
    <Badge variant={variants[status]} className="text-xs">
      {status}
    </Badge>
  );
}

function QualityBadge({ quality }: { quality: ExtractionQuality }) {
  const variants: Record<ExtractionQuality, "default" | "secondary" | "destructive"> = {
    complete: "default",
    partial: "secondary",
    failed: "destructive",
  };

  return (
    <Badge variant={variants[quality]} className="text-xs">
      {quality}
    </Badge>
  );
}

export function LeadRow({ lead, onEdit, onDelete }: LeadRowProps) {
  return (
    <TableRow className="group">
      <TableCell>
        <div className="font-medium">{formatName(lead)}</div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <DisplayValue value={lead.position} />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <DisplayValue value={lead.company} />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <DisplayValue value={lead.location} />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex flex-col gap-0.5">
          {lead.email && lead.email.trim() && (
            <span className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3 text-muted-foreground" />
              {lead.email}
            </span>
          )}
          {lead.phone && lead.phone.trim() && (
            <span className="flex items-center gap-1 text-xs">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {lead.phone}
            </span>
          )}
          {!lead.email?.trim() && !lead.phone?.trim() && (
            <DisplayValue value={null} />
          )}
        </div>
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <StatusBadge status={lead.status} />
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <QualityBadge quality={lead.extraction_quality} />
      </TableCell>
      <TableCell>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
            aria-label={`Edit lead ${formatName(lead)}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
              aria-label={`Delete lead ${formatName(lead)}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
