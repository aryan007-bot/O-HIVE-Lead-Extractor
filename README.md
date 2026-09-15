# O-HIVE Business Card Lead Extractor Application

A production-grade, public application for extracting structured sales leads from bulk business card uploads using the **Qwen Vision-Language Model (VLM)**, FastAPI backend, Next.js 16 frontend, and PostgreSQL database.

---

## 📋 Overview

The **O-HIVE Lead Extractor** automates sales pipeline creation by extracting contact metadata (First Name, Last Name, Position, Company, Location, Phone, Email) from uploaded business cards. Built for high performance, reliability, and $0 cost deployment, it provides real-time extraction, search/filter capabilities, lead editing, deletion, and real Excel `.xlsx` report generation.

---

## ✨ Features

* **Bulk Business Card Upload:** Drag & drop multiple JPEG, PNG, or WEBP images simultaneously.
* **Qwen Vision-Language Model (VLM):** Intelligent visual extraction using `qwen/qwen-2.5-vl-72b-instruct:free` (OpenRouter API) with zero-shot visual comprehension.
* **Multi-Layer Fallback Engine:** Automatic failover to `rapidocr-onnxruntime` (ONNX DBNet + CRNN) and Python heuristic regex engine if VLM API rate limits occur.
* **Persistent Lead Database:** PostgreSQL storage (Neon/Supabase) ensuring data survives page reloads and container restarts.
* **Interactive Leads Table:** Search across names/companies/locations, filter by extraction quality/status, inline editing, and deletion.
* **Excel Export:** Server-side `.xlsx` generation using `openpyxl` with mandatory field columns.
* **Resilient Non-Blocking Batch Processing:** Partial batch success guaranteed — 1 failed card does not crash the complete batch.

---

## 🏗️ Architecture

```text
                PUBLIC INTERNET
                       │
                       ▼
              ┌─────────────────┐
              │ Next.js Frontend│
              │  Vercel (Free)  │
              └────────┬────────┘
                       │ HTTPS
                       ▼
              ┌─────────────────┐
              │ FastAPI Backend │
              │  Render (Free)  │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │    Qwen VLM     │
              │ OpenRouter / HF │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │    Database     │
              │ Neon PostgreSQL │
              └─────────────────┘
```

---

## 🔄 System Flow

```text
Next.js Frontend (Upload Drag & Drop)
   ↓
FastAPI Request Handler (`/api/v1/upload`)
   ↓
Image Type & Size Validation (Max 10 MB, JPEG/PNG/WEBP)
   ↓
Qwen VLM Service Layer (`vlm_service.py`)
   ↓
JSON Extraction & Schema Normalization
   ↓
Pydantic Validation (`LeadCreate` / `LeadResponse`)
   ↓
SQLAlchemy Database Persistence (`leads` table)
   ↓
Leads Dashboard API & Next.js UI Updates
   ↓
Server-Side Excel (.xlsx) Generation
```

### Why VLM Service Isolation?
The `VLMService` class abstracts model execution behind a clean interface. This decouples API provider changes, model weight upgrades, and fallback OCR engines from API routing logic.

### Why Pre-Storage Validation?
Strict Pydantic schemas enforce type safety, email format validation, and phone number cleaning before touching database tables, ensuring zero corrupt database records.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Glassmorphism UI.
* **Backend:** FastAPI, Python 3.11/3.14, Pydantic v2, Uvicorn, Async HTTPX, openpyxl.
* **VLM Engine:** Qwen 2.5 VLM (`qwen/qwen-2.5-vl-72b-instruct:free` via OpenRouter API with `rapidocr-onnxruntime` pure-Python fallback).
* **Database:** PostgreSQL (Neon / Supabase) for cloud production; SQLite (`leads.db`) for local dev.
* **Containerization:** Docker & Docker Compose (`docker-compose.yml`).

---

## 📁 Project Structure

```text
ohive/
├── frontend/                 # Next.js 16 Frontend Application
│   ├── app/                  # App Router pages (Dashboard, Documentation)
│   ├── components/           # React UI components (LeadTable, UploadZone, Header)
│   ├── lib/                  # API client & helper constants
│   ├── Dockerfile            # Multi-stage Next.js Dockerfile
│   └── vercel.json           # Vercel deployment configuration
├── backend/                  # FastAPI Backend Application
│   ├── app/
│   │   ├── api/routes/       # API endpoints (upload, leads, export, health)
│   │   ├── core/             # Configuration, logging, exception handlers
│   │   ├── models/           # SQLAlchemy LeadORM schema
│   │   ├── schemas/          # Pydantic data schemas
│   │   └── services/         # VLMService & ExtractionService
│   ├── tests/                # Pytest test suite (15 tests)
│   ├── Dockerfile            # Dynamic PORT-compatible backend Dockerfile
│   ├── render.yaml           # Render Web Service deployment configuration
│   └── requirements.txt      # Python package dependencies
├── docker-compose.yml        # Multi-container local orchestration
└── README.md                 # Project documentation
```

---

## 🤖 Qwen VLM Implementation

The application leverages **Qwen 2.5 VLM** (`qwen/qwen-2.5-vl-72b-instruct:free` via OpenRouter API). It receives base64-encoded business card images and returns structured JSON matching the target schema:

```json
{
  "first_name": "Rahul",
  "last_name": "Sharma",
  "position": "Senior Software Engineer",
  "company": "Acme Technologies",
  "location": "Delhi, India",
  "phone": "+91 98765 43210",
  "email": "rahul.sharma@acme.com"
}
```

Missing fields are returned as `null` and saved as database `NULL`. Fake placeholder strings (such as "N/A", "Unknown", "None") are strictly prohibited.

---

## 🗄️ Database Schema & Persistence

The `leads` table schema (`LeadORM` in [`backend/app/models/lead.py`](file:///c:/Users/Aryan%20Dagar/OneDrive/Desktop/hire/backend/app/models/lead.py)):

| Column Name | Data Type | Nullable | Default / Details |
| :--- | :--- | :--- | :--- |
| `id` | Integer | No | Primary Key, Auto-increment |
| `first_name` | String | Yes | Extracted First Name |
| `last_name` | String | Yes | Extracted Last Name |
| `position` | String | Yes | Job Title / Role |
| `company` | String | Yes | Organization Name |
| `location` | String | Yes | Physical Address / City / State |
| `phone` | String | Yes | Contact Phone Number |
| `email` | String | Yes | Contact Email Address |
| `status` | String | No | Default: `"extracted"` |
| `extraction_quality` | String | No | `"complete"` or `"partial"` |
| `source_filename` | String | Yes | Original uploaded image filename |
| `created_at` | DateTime | No | UTC Timestamp |
| `updated_at` | DateTime | No | UTC Timestamp on update |

Auto-table initialization (`Base.metadata.create_all`) creates all tables on database connection without destructive reset operations.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status (`{"status": "ok", "service": "ohive-backend"}`) |
| `GET` | `/api/v1/health/model` | Qwen VLM model readiness status |
| `POST` | `/api/v1/upload` | Bulk business card upload & VLM extraction |
| `GET` | `/api/v1/leads` | List leads (supports `search`, `status`, `quality`, `location`, `company`) |
| `GET` | `/api/v1/leads/{id}` | Retrieve single lead by ID |
| `PATCH` | `/api/v1/leads/{id}` | Edit existing lead fields |
| `DELETE` | `/api/v1/leads/{id}` | Remove lead by ID |
| `DELETE` | `/api/v1/leads` | Bulk delete leads |
| `GET` | `/api/v1/export/excel` | Download leads as real `.xlsx` Excel file |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
APP_NAME=ohive-backend
APP_ENV=production
PORT=8000

# VLM Configuration
VLM_PROVIDER=hosted
VLM_MODEL_NAME=qwen/qwen-2.5-vl-72b-instruct:free
VLM_API_URL=https://openrouter.ai/api/v1/chat/completions
VLM_API_KEY=your_openrouter_api_key_here
VLM_DEVICE=auto
VLM_MAX_CONCURRENCY=2
VLM_MAX_NEW_TOKENS=512

# Database Configuration (PostgreSQL for cloud, SQLite for local)
DATABASE_URL=postgresql+psycopg://user:password@ep-sample-123.singapore.aws.neon.tech/ohive_db?sslmode=require

# CORS
CORS_ORIGINS=https://ohive-lead-extractor.vercel.app,http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
NEXT_PUBLIC_API_URL=https://ohive-backend.onrender.com
```

---

## 🚀 Local Setup & Execution

### 1. Running Backend

```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Running Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Docker Compose (Full Stack)

```bash
docker-compose up --build
```

---

## 🌐 Public Deployment & Demo

* **Frontend Public URL:** [https://ohive-lead-extractor.vercel.app](https://ohive-lead-extractor.vercel.app) *(Active Localtunnel: `https://plenty-guests-cry.loca.lt`)*
* **Backend Public URL:** [https://ohive-backend.onrender.com](https://ohive-backend.onrender.com) *(Active Localtunnel: `https://breezy-days-tickle.loca.lt`)*
* **Interactive API Docs (Swagger UI):** [https://ohive-backend.onrender.com/docs](https://ohive-backend.onrender.com/docs)
* **GitHub Repository:** [https://github.com/aryan007-bot/O-HIVE-Lead-Extractor.git](https://github.com/aryan007-bot/O-HIVE-Lead-Extractor.git)

---

## 🧪 Testing

The backend includes a comprehensive `pytest` test suite:

```bash
cd backend
.\.venv\Scripts\python.exe -m pytest
```

**Results:** 15 passed, 0 failed across health checks, validation, lead CRUD, and Excel export.

---

## ⚡ Known Limitations & Future Improvements

### Known Limitations
1. **Free-Tier Cold Starts (Render):** Free web services sleep after 15 minutes of inactivity. Initial startup takes ~30–50s.
2. **OpenRouter Rate Limits:** Free Qwen VLM requests are throttled at ~20 req/min. The system handles this gracefully using internal RapidOCR fallback.
3. **Ephemeral Image Storage:** Uploaded card images are deleted immediately after VLM extraction. Extracted lead data is permanently saved in PostgreSQL.

### Future Improvements
* Webhook notifications for bulk extraction completion.
* S3/Cloudinary integration for permanent business card image archival.
* Custom user authentication (JWT / OAuth2).

---

## 🤖 AI Usage

AI coding assistants were used during development for:
- Code scaffolding
- API implementation assistance
- Frontend component development
- Debugging
- Test generation
- Documentation assistance
- Deployment configuration assistance

Generated suggestions were reviewed, modified, and integrated based on the application's requirements and architecture.
