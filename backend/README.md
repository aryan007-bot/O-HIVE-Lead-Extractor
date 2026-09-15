# O-HIVE Assignment 1 — Backend

## Overview

Production-ready backend for VLM Business Card Lead Extraction. Uses Qwen Vision-Language Model to extract structured lead information from business card images via a REST API.

## Architecture

```
                 ┌──────────────────────┐
                 │      Next.js UI      │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │      FastAPI         │
                 │      REST API        │
                 └──────────┬───────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       Image Service   Extraction     Repository
                            │
                            ▼
                       VLM Service
                            │
                            ▼
                        Qwen VLM
                            │
                            ▼
                     Structured JSON
                            │
                            ▼
                       Pydantic
                            │
                            ▼
                     Normalization
                            │
                            ▼
                         Lead DB
                            │
                            ▼
                      Excel Export
```

The architecture separates concerns: API routes handle HTTP, services contain business logic, the repository abstracts persistence, and the VLM service isolates model-specific code. This makes each layer independently testable and replaceable.

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, lifespan, middleware
│   ├── core/                # Config, logging, exceptions
│   ├── api/                 # Routes and router registration
│   ├── schemas/             # Pydantic models
│   ├── services/            # Business logic (VLM, extraction, export)
│   ├── models/              # SQLAlchemy ORM models
│   ├── repositories/        # Data access layer
│   └── utils/               # File, JSON, validation utilities
├── tests/
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Requirements

- Python 3.11+
- Qwen VLM (Qwen2-VL-2B-Instruct or compatible)
- ~4GB RAM for 2B model, GPU recommended

## Local Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | ohive-vlm-backend | Application name |
| `APP_ENV` | development | Environment |
| `DEBUG` | true | Debug mode |
| `HOST` | 0.0.0.0 | Server host |
| `PORT` | 8000 | Server port |
| `QWEN_MODEL_NAME` | Qwen/Qwen2-VL-2B-Instruct | HuggingFace model ID |
| `QWEN_DEVICE` | auto | Device (auto/cuda/cpu) |
| `QWEN_MAX_NEW_TOKENS` | 512 | Max generation tokens |
| `MAX_FILE_SIZE_MB` | 10 | Max upload size |
| `MAX_BULK_FILES` | 20 | Max files per request |
| `VLM_MAX_CONCURRENCY` | 2 | Concurrent VLM inferences |
| `DATABASE_URL` | sqlite:///./leads.db | Database URL |
| `CORS_ORIGINS` | http://localhost:3000 | Allowed origins |

## Running Locally

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/v1/health/model` | VLM model status |
| POST | `/api/v1/upload` | Upload business card images |
| GET | `/api/v1/leads` | List extracted leads |
| GET | `/api/v1/leads/{id}` | Get single lead |
| DELETE | `/api/v1/leads` | Delete all leads |
| GET | `/api/v1/export/excel` | Download leads as XLSX |

Swagger docs at `/docs`, ReDoc at `/redoc`.

## Qwen VLM

The backend uses Qwen2-VL for vision-language inference. The model loads once at startup and stays in memory. The `VLMService` class encapsulates all model logic, keeping routes clean.

Configure via `QWEN_MODEL_NAME`, `QWEN_DEVICE`, and `QWEN_MAX_NEW_TOKENS`.

## Business Card Extraction Pipeline

```
Image → Qwen VLM → Raw Output → JSON Parser → Pydantic Validation → Normalization → Lead
```

The extraction prompt instructs the model to return only JSON with the seven required fields, using null for missing information.

## Bulk Processing

Multiple images are processed with controlled concurrency via `asyncio.Semaphore`. The `VLM_MAX_CONCURRENCY` setting prevents memory exhaustion. One failed card does not affect others.

## Excel Export

The `/api/v1/export/excel` endpoint generates a formatted XLSX with bold headers, frozen header row, auto-filter, and appropriate column widths.

## Docker

```bash
docker build -t ohive-vlm-backend .
docker run --env-file .env -p 8000:8000 ohive-vlm-backend
```

## AWS Deployment

- Use ECS Fargate or EC2 with GPU for model inference
- Store `leads.db` on EFS or switch to RDS PostgreSQL
- Use S3 for temporary file staging
- Set `QWEN_DEVICE=cuda` on GPU instances
- Configure `CORS_ORIGINS` to the CloudFront domain

## Testing

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
```

Tests mock the VLM to avoid loading the actual model during unit tests.

## Performance Considerations

- Model loads once at startup, not per request
- Concurrency is bounded by `VLM_MAX_CONCURRENCY`
- Temporary files are cleaned after each extraction
- Images are validated and preprocessed before VLM inference
- SQLite suitable for development; use PostgreSQL for production

## Known Limitations

- SQLite does not support high-concurrency writes
- No authentication/authorization
- No rate limiting
- No image caching
- Model inference speed depends on hardware

## Future Improvements

- Add authentication (JWT/API keys)
- Switch to PostgreSQL for production
- Add Redis-based job queue for async processing
- Implement image caching
- Add batch export scheduling
- Support additional VLM models
- Add webhook notifications

## AI Usage

AI-assisted development tools were used during development.

### Tools

- OpenAI ChatGPT
- Cursor IDE

### Used For

- Initial architecture brainstorming
- FastAPI boilerplate and structure
- Pydantic schema design
- Error handling patterns
- Test case generation
- Documentation drafting

### Adopted AI Recommendations

- Modular service separation (VLMService, ExtractionService, etc.)
- Controlled concurrency with asyncio.Semaphore
- Structured error responses with error codes
- Pipeline-based extraction flow

### Modified / Rejected Recommendations

- AI-recommended caching strategies were deferred as premature optimization
- Some suggested database migrations were simplified to raw SQLAlchemy for this assessment scope
- AI-recommended extensive logging was trimmed to essential fields only

All submitted code was reviewed and tested by the developer.
