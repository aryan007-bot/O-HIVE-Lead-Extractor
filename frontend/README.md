# O-HIVE Lead Extractor Frontend

## Overview

A polished, production-grade AI SaaS dashboard for extracting structured lead data from business card images. Users can upload multiple business cards, process them through an AI VLM backend, review and edit extracted leads, and export results as Excel files.

## Features

- **Multi-file Upload** — Drag & drop or browse to upload multiple business card images (JPG, PNG, WEBP)
- **Image Previews** — Thumbnail previews for all uploaded files
- **AI Processing** — Process cards through Qwen VLM backend for lead extraction
- **Lead Table** — View all extracted leads in a clean, searchable table
- **Search & Filter** — Client-side search across all lead fields; filter by email/phone availability
- **Lead Editing** — Edit any extracted lead field via a slide-out editor
- **Excel Export** — Download all leads as an Excel file via backend API
- **Partial Failure Handling** — Graceful handling when some cards fail to process
- **Responsive Design** — Works on desktop, laptop, tablet, and mobile
- **Dark Mode** — Full light/dark theme support via CSS variables

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (base-nova style)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Server State:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Notifications:** Sonner

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Redirects to /dashboard
│   ├── globals.css         # Global styles & theme variables
│   ├── error.tsx           # Error boundary
│   └── dashboard/
│       ├── page.tsx        # Main dashboard workspace
│       └── loading.tsx     # Dashboard loading skeleton
├── components/
│   ├── layout/             # App shell, sidebar, topbar, mobile nav
│   ├── upload/             # Upload zone, file list, progress
│   ├── leads/              # Lead table, editor, details
│   ├── dashboard/          # Header, stats cards, summary
│   ├── export/             # Excel export button
│   ├── shared/             # Loading, error, empty states, badges
│   └── ui/                 # shadcn/ui components
├── hooks/                  # TanStack Query hooks (upload, leads, export)
├── lib/
│   ├── api/                # HTTP client & API functions
│   ├── validations/        # Zod schemas for upload validation
│   ├── utils.ts            # cn() utility
│   └── constants.ts        # App constants & config
├── types/                  # TypeScript type definitions
├── providers/              # Query, Toast, and Tooltip providers
└── public/                 # Static assets
```

## Environment Variables

```env
# Backend API URL (required)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Only `NEXT_PUBLIC_` prefixed variables are exposed to the browser. No secrets should be placed in this file.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

## Backend Configuration

The frontend expects a FastAPI backend running at the URL specified in `NEXT_PUBLIC_API_URL`. The backend should implement:

- `POST /api/v1/upload/cards` — Accept multipart form data with business card images
- `GET /api/v1/leads` — Return all extracted leads
- `PUT /api/v1/leads/{id}` — Update a lead
- `DELETE /api/v1/leads/{id}` — Delete a lead
- `DELETE /api/v1/leads` — Delete all leads
- `GET /api/v1/export/excel` — Generate and return Excel file

## Production Build

```bash
npm run build
npm start
```

## Deployment

The application is a standard Next.js app and can be deployed to:

- Vercel (recommended)
- Any Node.js hosting platform
- Docker containers

Ensure `NEXT_PUBLIC_API_URL` is set to your production backend URL.

## API Integration

All API communication is centralized in `lib/api/`:

- `client.ts` — Base HTTP client with error handling
- `upload.ts` — File upload to backend
- `leads.ts` — CRUD operations for leads
- `export.ts` — Excel file download

State management uses TanStack Query hooks in `hooks/`:

- `use-upload.ts` — Upload state and processing
- `use-leads.ts` — Lead data, search, and filtering
- `use-export.ts` — Excel export

## AI Usage

This frontend is designed to work with a Qwen VLM (Vision Language Model) backend. The AI pipeline:

1. User uploads business card images
2. Frontend sends images to FastAPI backend
3. Backend processes images through Qwen VLM
4. VLM extracts structured fields (name, position, company, phone, email, location)
5. Results are returned to frontend for display and editing
6. User can correct any extraction errors
7. Final data can be exported as Excel

The frontend never directly interacts with the AI model — all processing is handled by the backend API.
