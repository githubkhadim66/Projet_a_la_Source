# ── À la Source — commandes de développement ─────────────────────────────────
.PHONY: help dev dev-front dev-back test lint build up down seed migrate

help:
	@echo "make dev-front   → serveur Vite (http://localhost:5173)"
	@echo "make dev-back    → API FastAPI avec reload (http://localhost:8000/api/docs)"
	@echo "make up          → stack Docker complète (front+back+Postgres)"
	@echo "make down        → arrêt de la stack Docker"
	@echo "make test        → tests backend (pytest)"
	@echo "make lint        → lint backend (ruff)"
	@echo "make build       → build de production du frontend"
	@echo "make seed        → admin + données de démo"
	@echo "make migrate     → alembic upgrade head"

dev-front:
	cd frontend && npm run dev

dev-back:
	cd backend && uvicorn app.main:app --reload

up:
	docker compose up --build

down:
	docker compose down

test:
	cd backend && pytest

lint:
	cd backend && ruff check .

build:
	cd frontend && npm run build

seed:
	cd backend && python -m app.initial_data

migrate:
	cd backend && alembic upgrade head
