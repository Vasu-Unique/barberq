.PHONY: help dev dev-d dev-down prod prod-d prod-down down build logs logs-api logs-web test-api seed clean shell shell-api

# Default target
.DEFAULT_GOAL := help

help:
	@echo "BarberQ - Smart queues. Better grooming."
	@echo "Available commands:"
	@echo "  make dev         - Run development environment (API + DB + WebApp with live reload)"
	@echo "  make dev-d       - Run development environment in background (detached mode)"
	@echo "  make dev-down    - Stop development environment"
	@echo "  make prod        - Build and run production environment (http://localhost:8080)"
	@echo "  make prod-d      - Run production environment in background (detached mode)"
	@echo "  make prod-down   - Stop production environment"
	@echo "  make down        - Stop all containers"
	@echo "  make build       - Build dev and prod Docker images"
	@echo "  make logs        - Tail all container logs"
	@echo "  make logs-api    - Tail API container logs"
	@echo "  make logs-web    - Tail WebApp container logs"
	@echo "  make test-api    - Run API automated test suite inside Docker"
	@echo "  make seed        - Seed database with default admin, staff, salons, and services"
	@echo "  make shell-api   - Open a shell inside running API container"
	@echo "  make clean       - Remove containers, images, and volumes"

dev:
	docker compose -f docker-compose.dev.yml up --build

dev-d:
	docker compose -f docker-compose.dev.yml up --build -d

dev-down:
	docker compose -f docker-compose.dev.yml down

prod:
	docker compose -f docker-compose.prod.yml up --build

prod-d:
	docker compose -f docker-compose.prod.yml up --build -d

prod-down:
	docker compose -f docker-compose.prod.yml down

down:
	docker compose -f docker-compose.dev.yml down
	docker compose -f docker-compose.prod.yml down

build:
	docker compose -f docker-compose.dev.yml build
	docker compose -f docker-compose.prod.yml build

logs:
	docker compose -f docker-compose.dev.yml logs -f

logs-api:
	docker compose -f docker-compose.dev.yml logs -f api

logs-web:
	docker compose -f docker-compose.dev.yml logs -f webapp

test-api:
	docker compose -f docker-compose.dev.yml run --rm api pytest -v

seed:
	docker compose -f docker-compose.dev.yml exec api python seed.py

shell:
	docker compose -f docker-compose.dev.yml exec webapp sh

shell-api:
	docker compose -f docker-compose.dev.yml exec api bash

clean:
	docker compose -f docker-compose.dev.yml down -v --remove-orphans
	docker compose -f docker-compose.prod.yml down -v --remove-orphans
