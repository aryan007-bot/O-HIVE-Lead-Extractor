"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ScanLine,
  Contact,
  BookOpen,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Extract Leads", href: "/dashboard", icon: ScanLine },
  { label: "Leads", href: "/dashboard?view=leads", icon: Contact },
];

const systemItems = [
  { label: "Documentation", href: "/documentation", icon: BookOpen },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = typeof window !== "undefined" ? window.location.search : "";
  const currentView = searchParams.includes("view=leads") ? "leads" : "dashboard";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <span className="text-sm font-bold">{APP_NAME.slice(0, 2)}</span>
          </Link>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        )}
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto py-3">
        {!collapsed && (
          <p className="mb-2 px-4 text-xs font-medium uppercase text-muted-foreground">
            Workspace
          </p>
        )}
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? item.label === "Dashboard"
                  ? !searchParams || currentView === "dashboard"
                  : item.label === "Leads"
                  ? currentView === "leads"
                  : false
                : pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <Separator className="my-3" />

        {!collapsed && (
          <p className="mb-2 px-4 text-xs font-medium uppercase text-muted-foreground">
            System
          </p>
        )}
        <nav className="space-y-1 px-2">
          {systemItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
