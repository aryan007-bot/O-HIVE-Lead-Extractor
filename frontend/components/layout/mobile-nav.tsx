"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  ScanLine,
  Contact,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Extract Leads", href: "/dashboard", icon: ScanLine },
  { label: "Leads", href: "/dashboard?view=leads", icon: Contact },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
      />
      <nav className="fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-lg lg:hidden">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="text-lg font-bold">O-HIVE</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="py-3">
          <p className="mb-2 px-6 text-xs font-medium uppercase text-muted-foreground">
            Workspace
          </p>
          <div className="space-y-1 px-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
