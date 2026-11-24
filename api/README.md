# BarberQ – Backend API
**Smart queues. Better grooming.**

Scalable, secure, production-ready backend API for BarberQ digital salon queue management platform.

---

## 1. Tech Stack

- **Framework:** FastAPI (Python 3.12+)
- **Validation:** Pydantic v2
- **ASGI Server:** Uvicorn
- **Database:** PostgreSQL (with `asyncpg` async driver)
- **ORM & Migrations:** SQLAlchemy 2.0 (asynchronous) & Alembic
- **Authentication:** JWT (OAuth2 Password Bearer) with rotating refresh tokens (hashed in database)
- **Password Hashing:** Bcrypt
- **Real-Time:** WebSockets with Connection Manager
- **Testing:** Pytest, pytest-asyncio, HTTPX

---

## 2. Architecture & Modules

```
api/
├── app/
│   ├── main.py                  # Application entrypoint & middleware
│   ├── core/                    # Config, security, DB engine, dependencies, permissions, exceptions
│   ├── models/                  # 13 SQLAlchemy 2.0 ORM models
│   ├── schemas/                 # Pydantic v2 validation & response schemas
│   ├── api/v1/                  # REST API endpoints & route groupings
│   ├── services/                # Business logic layer (Auth, Queue, Salon, Notification, Audit)
│   ├── repositories/            # Data access layer
│   ├── websocket/               # WebSocket connection manager & real-time events
│   └── utils/                   # Pagination & validators
├── alembic/                     # Database migrations
├── tests/                       # Automated test suite
├── Dockerfile                   # Production Dockerfile
├── Dockerfile.dev               # Development Dockerfile with live reload
├── requirements.txt             # Python dependencies
└── pyproject.toml               # Package configuration
```

---

## 3. Database Schema

The database features 13 tables:
1. `users` – User accounts
2. `roles` – Default roles: `admin` (1), `staff` (2), `users` (3)
3. `user_roles` – Composite PK `(user_id, role_id)` for RBAC
4. `audit_logs` – Append-only log tracking `LOGIN`, `LOGOUT`, security events
5. `refresh_tokens` – Secure hashed refresh tokens with reuse detection & family revocation
6. `salons` – Salons and barbershops
7. `salon_members` – Staff-to-salon assignments
8. `services` – Haircuts, beard trims, and grooming packages with duration & pricing
9. `operating_hours` – Salon daily opening and closing hours
10. `queue_sessions` – Daily queue session per salon
11. `queue_entries` – Digital queue tokens with service snapshots
12. `notifications` – Real-time customer and staff alerts
13. `queue_events` – Audit trail for queue operations (`QUEUE_JOINED`, `TOKEN_CALLED`, `SERVICE_STARTED`, `SERVICE_COMPLETED`, `TOKEN_CANCELLED`, `TOKEN_SKIPPED`)

---

## 4. API Endpoints Overview

### Authentication (`/api/v1/auth`)
- `POST /register` – Register customer account (assigns role ID 3 `users`)
- `POST /login` – Authenticate user, returns access + refresh tokens, records `LOGIN` audit log
- `POST /refresh` – Rotates refresh token, detects reuse and revokes token family on replay
- `POST /logout` – Invalidate refresh token and record `LOGOUT` in audit logs
- `GET /me` – Current user profile and assigned roles

### Salons (`/api/v1/salons`)
- `GET /` – List salons (supports search, city filter, pagination)
- `GET /{salon_id}` – Salon details including services and operating hours
- `POST /` – Create new salon (staff or admin)
- `PATCH /{salon_id}` – Update salon settings
- `DELETE /{salon_id}` – Delete salon (owner/admin)
- `GET /{salon_id}/members` – List staff members
- `POST /{salon_id}/members` – Add staff member
- `DELETE /{salon_id}/members/{user_id}` – Remove staff member
- `GET /{salon_id}/services` – List services
- `POST /{salon_id}/services` – Add service
- `PATCH /{salon_id}/services/{service_id}` – Update service
- `DELETE /{salon_id}/services/{service_id}` – Delete service

### Queue Management (`/api/v1/queues`)
- `GET /salon/{salon_id}` – Live queue status, serving token, waiting count, total wait time
- `POST /join/{salon_id}` – Customer joins queue with concurrency-safe token generation
- `GET /my-queue` – Customer active tokens
- `GET /token/{entry_id}` – Token details and live position
- `PATCH /{entry_id}/cancel` – Cancel active token

### Staff Queue Actions (`/api/v1/admin/queues/{salon_id}`)
- `GET /` – Staff queue dashboard
- `POST /call-next` – Call earliest waiting customer (`CALLED`) and alert upcoming customers
- `PATCH /{entry_id}/start` – Start grooming service (`SERVING`)
- `PATCH /{entry_id}/complete` – Complete service (`COMPLETED`)
- `PATCH /{entry_id}/skip` – Mark customer as skipped (`SKIPPED`)
- `POST /walk-in` – Add walk-in customer directly into queue

### Real-Time WebSocket (`/api/v1/ws/queues/{salon_id}`)
- Connect via WebSocket: `ws://localhost:8000/api/v1/ws/queues/{salon_id}?token=JWT_ACCESS_TOKEN`
- Events: `QUEUE_UPDATED`, `TOKEN_CALLED`, `SERVICE_STARTED`, `SERVICE_COMPLETED`, `TOKEN_CANCELLED`, `YOU_ARE_NEXT`, `YOUR_TURN_APPROACHING`

### Notifications (`/api/v1/notifications`)
- `GET /` – List customer notifications
- `PATCH /{notification_id}/read` – Mark notification as read
- `PATCH /read-all` – Mark all as read

### Audit Logs (`/api/v1/audit-logs`)
- `GET /` – Admin query audit logs (filter by user_id, action, date range)
- `GET /{log_id}` – Specific audit log record

---

## 5. Docker Usage

### Running with Docker Compose:
From the project root:
```bash
# Start backend, postgres, and frontend together
make dev
# or detached:
make dev-d
```

### Direct API Container Run:
```bash
docker build -t barberq-api -f api/Dockerfile api/
docker run -p 8000:8000 --env-file api/.env barberq-api
```

---

## 6. Running Tests

```bash
cd api
pytest -v
```
