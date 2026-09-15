"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanLine, Contact, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface StatsCardsProps {
  totalLeads: number;
  withEmail: number;
  sessionJobs: number;
  complete?: number;
  partial?: number;
  failed?: number;
}

export function StatsCards({
  totalLeads,
  withEmail,
  sessionJobs,
  complete = 0,
  partial = 0,
  failed = 0,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Total Leads",
      value: totalLeads,
      subtitle: `${withEmail} with email`,
      icon: Contact,
    },
    {
      title: "Complete",
      value: complete,
      subtitle:
        totalLeads > 0
          ? `${Math.round((complete / totalLeads) * 100)}% of leads`
          : "No data",
      icon: CheckCircle,
    },
    {
      title: "Partial",
      value: partial,
      subtitle:
        totalLeads > 0
          ? `${Math.round((partial / totalLeads) * 100)}% of leads`
          : "No data",
      icon: AlertTriangle,
    },
    {
      title: "Failed",
      value: failed,
      subtitle:
        totalLeads > 0
          ? `${Math.round((failed / totalLeads) * 100)}% of leads`
          : "No data",
      icon: XCircle,
    },
    {
      title: "Processing Jobs",
      value: sessionJobs,
      subtitle: "This session",
      icon: ScanLine,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
