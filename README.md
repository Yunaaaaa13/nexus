# NEXUS - Indonesian Market Intelligence

Indonesian Market Intelligence platform built with Next.js, FastAPI, and PostgreSQL.

## Architecture

```text
nexus/
├── apps/
│   ├── web/          # Next.js (TypeScript, Tailwind CSS, App Router)
│   └── api/          # FastAPI (Python, SQLAlchemy, Alembic)
│
├── database/
│   └── migrations/   # Alembic migration scripts
│
├── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
└── README.md
```

## Quick Start

### 1. Database (PostgreSQL)

Using Docker:
```bash
docker compose up -d
```

Or connect to an existing local PostgreSQL instance using the credentials configured in `.env`.

### 2. Backend (FastAPI)

```bash
cd apps/api

# Activate virtual environment (Windows PowerShell)
.venv\Scripts\activate

# Activate virtual environment (macOS/Linux)
# source .venv/bin/activate

# Start API server
uvicorn app.main:app --reload
```

- API Base: `http://localhost:8000`
- API Docs (Swagger UI): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 3. Frontend (Next.js)

```bash
cd apps/web
npm run dev
```

- Frontend App: `http://localhost:3000`
