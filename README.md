# O-HIVE Business Card Lead Extractor Application

A production-grade, public application for extracting structured sales leads from bulk business card uploads using the **Qwen Vision-Language Model (VLM)**, FastAPI backend, Next.js 16 frontend, and PostgreSQL database.

---

## 🏗️ System Architecture

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

## 🌐 Deployment Information

* **Frontend Public URL:** [https://ohive-lead-extractor.vercel.app](https://ohive-lead-extractor.vercel.app) *(or localtunnel: `https://plenty-guests-cry.loca.lt`)*
* **Backend Public URL:** [https://ohive-backend.onrender.com](https://ohive-backend.onrender.com) *(or localtunnel: `https://breezy-days-tickle.loca.lt`)*
* **Interactive API Documentation (Swagger UI):** [https://ohive-backend.onrender.com/docs](https://ohive-backend.onrender.com/docs)
* **Backend Health Check:** [https://ohive-backend.onrender.com/api/v1/health](https://ohive-backend.onrender.com/api/v1/health)
* **Model Health Check:** [https://ohive-backend.onrender.com/api/v1/health/model](https://ohive-backend.onrender.com/api/v1/health/model)

---

## 💡 Tech Stack & Features

* **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Glassmorphism UI.
* **Backend:** FastAPI, Python 3.11/3.14, Pydantic v2, Uvicorn, Async HTTPX.
* **VLM Engine:** Qwen 2.5 VLM (`qwen/qwen-2.5-vl-72b-instruct:free` via OpenRouter API with `rapidocr-onnxruntime` pure-Python fallback).
* **Database:** PostgreSQL (Neon / Supabase) for production persistence; SQLite (`leads.db`) for local dev.
* **Export:** Real Excel `.xlsx` report generator (`openpyxl`).
* **Containerization:** Docker & Docker Compose (`docker-compose.yml`).

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

## 🚀 Local Development Setup

### 1. Backend

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

### 2. Frontend

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

## ⚡ Free-Tier Hosting & Resource Limitations

1. **Backend Sleep & Cold Starts (Render Free Tier):**
   - Free instances auto-spin down after 15 minutes of inactivity.
   - Initial cold-start requests take ~30–50 seconds while the container boots. The UI displays appropriate loading states (`Connecting to extraction service...`).

2. **VLM Rate Limits (OpenRouter Free Tier):**
   - Free Qwen 2.5 VLM inference requests are subject to OpenRouter rate limits (approx 20 requests/min).
   - If rate limits are exceeded, the backend automatically transitions to the internal RapidOCR + heuristic engine without failing user uploads.

3. **Ephemeral Container Filesystem:**
   - Uploaded business card images are temporarily written for VLM processing and cleaned up immediately after extraction.
   - All extracted sales leads are permanently stored in the PostgreSQL database.

4. **Database Storage (Neon PostgreSQL Free Tier):**
   - 0.5 GiB storage capacity with automatic connection pooling, sufficient for thousands of lead records.

---

## 🤖 AI Usage

AI coding assistants were used during development for:
* Code scaffolding
* API integration
* Debugging
* Test generation
* Deployment configuration
* Documentation assistance

Generated suggestions were reviewed and adapted to the application's architecture.
