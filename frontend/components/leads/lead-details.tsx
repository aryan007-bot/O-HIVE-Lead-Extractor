"use client";

import { Mail, Phone, MapPin, Building2, Briefcase } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Lead } from "@/types/lead";

interface LeadDetailsProps {
  lead: Lead;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value && value.trim() ? value : "\u2014"}</p>
      </div>
    </div>
  );
}

export function LeadDetails({ lead }: LeadDetailsProps) {
  const fullName = [lead.first_name, lead.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {fullName || "Unknown Name"}
        </h3>
        {lead.position && (
          <p className="text-sm text-muted-foreground">{lead.position}</p>
        )}
        {lead.company && (
          <p className="text-sm text-muted-foreground">{lead.company}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <DetailRow icon={Briefcase} label="Position" value={lead.position} />
        <DetailRow icon={Building2} label="Company" value={lead.company} />
        <DetailRow icon={MapPin} label="Location" value={lead.location} />
        <DetailRow icon={Phone} label="Phone" value={lead.phone} />
        <DetailRow icon={Mail} label="Email" value={lead.email} />
      </div>
    </div>
  );
}
