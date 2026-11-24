# BarberQ – Smart queues. Better grooming.

Full-stack salon queue management platform featuring an asynchronous FastAPI backend and a React.js frontend, fully dockerized for both development and production.

---

## Architecture Overview

- **Frontend (`webapp/`)**: React.js + TypeScript + Vite + Tailwind CSS (`http://localhost:5173`)
- **Backend API (`api/`)**: FastAPI + Python 3.12 + SQLAlchemy 2.0 (asyncpg) + Alembic + WebSockets (`http://localhost:8000`)
- **Interactive Documentation**: Swagger UI at `http://localhost:8000/docs`, ReDoc at `http://localhost:8000/redoc`
- **Database (`postgres`)**: PostgreSQL 16 Alpine (`localhost:5432`)

---

## Quick Start

### 1. Start Development Environment (API + Database + WebApp)
To build and start all containers with live-reload:

```bash
make dev
```
- WebApp: **[http://localhost:5173](http://localhost:5173)**
- Backend API Docs: **[http://localhost:8000/docs](http://localhost:8000/docs)**
- PostgreSQL: **`localhost:5432`**

To run in detached mode (background):
```bash
make dev-d
```

To stop development containers:
```bash
make dev-down
```

---

### 2. Seed Default Database Data
To populate default roles, demo salons, services, and accounts (`admin@barberq.com`, `staff@barberq.com`, `customer@barberq.com`):

```bash
make seed
```

---

### 3. Run Automated Tests
Execute the comprehensive Pytest suite inside Docker:

```bash
make test-api
```

---

### 4. Production Environment
Build and start optimized production containers (Nginx + Uvicorn + PostgreSQL):

```bash
make prod
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

To stop production containers:
```bash
make prod-down
```

---

## Available Makefile Commands

| Command | Description |
|---|---|
| `make dev` | Build & run development environment (API, Postgres, WebApp with live reload) |
| `make dev-d` | Run development environment in detached background mode |
| `make dev-down` | Stop development environment containers |
| `make prod` | Build and run production environment (`http://localhost:8080`) |
| `make prod-d` | Run production environment in detached mode |
| `make prod-down` | Stop production environment containers |
| `make down` | Stop both dev and prod containers |
| `make build` | Build Docker images for both dev and prod |
| `make logs` | Tail logs from all containers |
| `make logs-api` | Tail logs from FastAPI container |
| `make logs-web` | Tail logs from WebApp container |
| `make test-api` | Run Pytest automated test suite in container |
| `make seed` | Seed database with default admin, staff, demo salons, and services |
| `make shell-api` | Open interactive shell inside running API container |
| `make clean` | Stop and remove containers, networks, and persistent volumes |
| `make help` | Display available commands |

---

## Backend Modules (`api/app/`)

- `core/`: Application settings (`pydantic-settings`), bcrypt password hashing, JWT access/refresh token generation, SQLAlchemy async engine, RBAC dependencies, permissions.
- `models/`: 13 relational SQLAlchemy models:
  `users`, `roles`, `user_roles`, `audit_logs`, `refresh_tokens`, `salons`, `salon_members`, `services`, `operating_hours`, `queue_sessions`, `queue_entries`, `notifications`, `queue_events`.
- `schemas/`: Pydantic v2 schemas with standardized `ApiResponse` structure (`success`, `message`, `data`).
- `api/v1/`:
  - `/auth`: Registration, Login, Refresh token rotation with reuse detection, Logout, Current user (`/me`).
  - `/users`: User listing, details, profile update, account status activation/deactivation.
  - `/roles`: List roles, assign/unassign roles.
  - `/salons`: Salon CRUD with search, filter, pagination, member management, services CRUD.
  - `/queues`: Customer queue join, live queue position, active token tracking, cancellation.
  - `/admin/queues/{salon_id}`: Staff queue management: call-next, start service, complete service, skip, walk-in customer addition.
  - `/notifications`: In-app customer and staff alerts, mark read, mark all read.
  - `/audit-logs`: Admin audit logging of security and authentication events.
- `websocket/`: Real-time WebSocket connection manager broadcasting `QUEUE_UPDATED`, `TOKEN_CALLED`, `SERVICE_STARTED`, `SERVICE_COMPLETED`, `TOKEN_CANCELLED`, `YOUR_TURN_APPROACHING`, `YOU_ARE_NEXT`.
- `alembic/`: Schema migrations tracking all 13 tables and seeded roles.
