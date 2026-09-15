"use client";

import { AppShell } from "@/components/layout/app-shell";
import { BookOpen, CheckCircle2, Database, FileSpreadsheet, Cpu, Layers, Server, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DocumentationPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 p-4 lg:p-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              v1.0.0 Architecture
            </Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">O-HIVE System Documentation</h1>
          <p className="text-muted-foreground">
            End-to-end technical documentation for the Vision-Language Model (VLM) Business Card Lead Extraction System.
          </p>
        </div>

        {/* Pipeline Diagram Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> System Architecture Pipeline
            </CardTitle>
            <CardDescription>
              High-performance flow from image upload to structured database persistence and Excel export.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {[
                { step: "1. Upload", title: "Next.js UI", desc: "Multi-file image upload with client validations" },
                { step: "2. Backend", title: "FastAPI REST", desc: "Bounded concurrency & image format validation" },
                { step: "3. VLM / OCR", title: "Qwen2-VL Model", desc: "Zero-shot extraction of 7 core lead schema fields" },
                { step: "4. Storage", title: "SQLite WAL DB", desc: "High-concurrency ORM storage & normalization" },
                { step: "5. Export", title: "Excel Output", desc: "Formatted .xlsx export with auto-filters & styles" },
              ].map((item, idx) => (
                <div key={idx} className="rounded-lg border bg-card p-3 shadow-sm text-center space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.step}
                  </span>
                  <h4 className="text-sm font-bold">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Core Features */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="h-4 w-4 text-primary" /> Vision-Language Model Inference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Uses <strong>Qwen2-VL-2B-Instruct</strong> to perform visual layout understanding and extract:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-foreground font-medium">
                <li>First Name & Last Name</li>
                <li>Job Title / Position</li>
                <li>Company Name</li>
                <li>City / Location</li>
                <li>Phone Number</li>
                <li>Email Address</li>
              </ul>
              <p className="text-xs pt-2">
                * Zero hallucination policy: Unidentified or missing card fields are strictly stored as <code>null</code>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" /> Validation & Normalization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Every extraction passes through automated Pydantic schema validation & normalization rules:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-foreground font-medium">
                <li>Email sanitization & regex validation</li>
                <li>International phone number formatting</li>
                <li>Name tokenization & whitespace cleanup</li>
                <li>Classification: Complete, Partial, or Failed</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* API Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" /> REST API Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 font-mono text-xs">
              {[
                { method: "POST", path: "/api/v1/upload", desc: "Upload batch of business card images" },
                { method: "GET", path: "/api/v1/leads", desc: "List extracted leads with search & pagination" },
                { method: "PATCH", path: "/api/v1/leads/{id}", desc: "Update extracted lead details" },
                { method: "DELETE", path: "/api/v1/leads/{id}", desc: "Delete specific lead" },
                { method: "GET", path: "/api/v1/export/excel", desc: "Export stored leads to .xlsx file" },
              ].map((api, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-md border p-2.5 gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={api.method === "POST" ? "default" : api.method === "GET" ? "secondary" : "destructive"}>
                      {api.method}
                    </Badge>
                    <span className="font-bold text-foreground">{api.path}</span>
                  </div>
                  <span className="text-muted-foreground font-sans text-xs">{api.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
