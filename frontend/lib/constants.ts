export const APP_NAME = "O-HIVE";
export const APP_PRODUCT = "O-HIVE Lead Extractor";
export const APP_TAGLINE = "Turn business cards into structured leads.";

export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES = 20;

export const API_ENDPOINTS = {
  upload: "/api/v1/upload",
  leads: "/api/v1/leads",
  lead: (id: number) => `/api/v1/leads/${id}`,
  leadStats: "/api/v1/leads/stats",
  leadFilters: "/api/v1/leads/filters",
  export: "/api/v1/export/excel",
} as const;

export const LEAD_TABLE_COLUMNS = [
  "first_name",
  "last_name",
  "position",
  "company",
  "location",
  "phone",
  "email",
] as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Extract Leads", href: "/dashboard", icon: "ScanLine", action: "extract" },
  { label: "Leads", href: "/dashboard?view=leads", icon: "Contact" },
] as const;

export const SYSTEM_NAV_ITEMS = [
  { label: "Documentation", href: "/documentation", icon: "BookOpen" },
] as const;
