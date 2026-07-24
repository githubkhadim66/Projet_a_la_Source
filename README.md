# À la Source — Plateforme MVP

Sourcing & export de produits d'origine africaine. Landing page bilingue de génération de leads, catalogue PDF gated, espace fournisseurs étanche et back-office admin — conformément au **CDC MVP v1.0** et au document **Parcours utilisateurs v1.0**.

## Architecture

```
┌──────────────┐     /api/*      ┌──────────────┐        ┌──────────────┐
│   Frontend   │ ──────────────▶ │   Backend    │ ─────▶ │  PostgreSQL  │
│ React + Vite │  (nginx proxy)  │   FastAPI    │        │      16      │
│ Tailwind v4  │                 │ SQLAlchemy 2 │        └──────────────┘
└──────────────┘                 └──────────────┘
      ▲                                 ▲
      └────────── Caddy (TLS Let's Encrypt) — production
```

| Dossier | Contenu |
|---|---|
| `frontend/` | Maquette Figma Make reprise à l'identique (App.tsx : landing, formulaires, RDV, espace fournisseurs, admin) + client API (`src/lib/api.ts`) |
| `backend/` | API FastAPI : leads (4 files), catalogue gated (lien signé), RDV, espace fournisseurs (magic link), admin (JWT) |
| `deploy/` | Caddyfile TLS, modèles `.env` staging/production |
| `.github/workflows/` | CI + déploiement continu staging/production |

## Démarrage rapide

### Option 1 — Docker (recommandé)

```bash
docker compose up --build
```

- Front : http://localhost:5173
- API + docs Swagger : http://localhost:8000/api/docs
- Postgres : localhost:5432 (`alasource`/`alasource`)

Le seed crée automatiquement l'admin (`admin@alasource.example` / `changeme-admin`) et un fournisseur de démo avec 4 produits.

### Option 2 — sans Docker

```bash
# Backend (Python 3.12)
cd backend
python -m venv .venv && .venv\Scripts\activate    # Windows
pip install -r requirements-dev.txt
python -m app.initial_data                         # seed admin + démo
uvicorn app.main:app --reload                      # http://localhost:8000

# Frontend (Node 20)
cd frontend
npm install
npm run dev                                        # http://localhost:5173 (proxy /api → :8000)
```

## API (préfixe `/api/v1`)

| Domaine | Endpoints |
|---|---|
| Leads | `POST /leads/catalogue` · `POST /leads/devis` · `POST /leads/sourcing` · `POST /leads/candidature` |
| Catalogue | `GET /catalogue/download?token=…` (lien signé expirant — CATA-01) |
| RDV expert | `GET /rdv/slots?day=…` · `POST /rdv` |
| Fournisseurs | `POST /suppliers/auth/magic-link` · `POST /suppliers/auth/verify` · `GET/PATCH /suppliers/me/products` · `POST /suppliers/me/proposals` |
| Admin | `POST /admin/auth/login` · `GET /admin/dashboard` · `GET/PATCH /admin/leads` · CRUD `/admin/suppliers`, `/admin/products`, `/admin/proposals`, `GET /admin/appointments` |

Points clés du CDC couverts côté API :
- **Zéro lead perdu** : chaque soumission = enregistrement horodaté + notification interne + accusé de réception E1/E2/E3 (FR/EN).
- **Étanchéité FRS-04** : un fournisseur ne voit et ne modifie que ses produits (testée par `tests/test_suppliers.py::test_etancheite_frs04_*`).
- **Anti-spam FOR-04** : honeypot invisible + consentement RGPD obligatoire non pré-coché.
- **CATA-04** : le PDF (`CATALOGUE_PDF_PATH`) est remplaçable à chaud sans redéploiement.

## Tests & qualité

```bash
cd backend
pytest          # 20 tests (leads, RDV, étanchéité fournisseurs, admin)
ruff check .    # lint
```

## CI/CD

| Workflow | Déclencheur | Actions |
|---|---|---|
| `ci.yml` | push/PR sur `main` et `develop` | build front, lint + tests back, build des 2 images Docker |
| `deploy-staging.yml` | push sur `develop` | push images GHCR `:staging` → SSH deploy → smoke test `/health` |
| `deploy-production.yml` | tag `v*.*.*` (ou manuel) | push images `:latest` + `:X.Y.Z` → SSH deploy (environnement protégé) → smoke test |

### Secrets GitHub à configurer

| Secret | Rôle |
|---|---|
| `STAGING_HOST` / `STAGING_USER` / `STAGING_SSH_KEY` / `STAGING_APP_DIR` / `STAGING_URL` | Serveur de staging |
| `PROD_HOST` / `PROD_USER` / `PROD_SSH_KEY` / `PROD_APP_DIR` / `PROD_URL` | Serveur de production |

`GITHUB_TOKEN` (automatique) suffit pour pousser sur GHCR. Protéger l'environnement `production` (Settings → Environments → required reviewers) pour exiger une approbation manuelle avant chaque mise en production.

### Préparation d'un serveur (staging ou production)

```bash
# 1. Installer Docker + plugin compose
curl -fsSL https://get.docker.com | sh

# 2. Créer le dossier applicatif et y copier :
mkdir -p /srv/alasource && cd /srv/alasource
#    - docker-compose.staging.yml (ou docker-compose.prod.yml + deploy/Caddyfile)
#    - .env.staging (ou .env.prod) à partir des modèles deploy/.env.*.example

# 3. Premier lancement
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d
docker compose exec backend python -m app.initial_data   # premier admin
```

En production, Caddy obtient et renouvelle automatiquement le certificat TLS pour `DOMAIN` (SEC-01 : HTTPS + redirection).

## Branches & flux de livraison

```
feature/* ──PR──▶ develop ──auto──▶ STAGING
                     │
                  PR + tag vX.Y.Z ──▶ main ──▶ PRODUCTION (approbation requise)
```

## Variables d'environnement

Voir [backend/.env.example](backend/.env.example), [frontend/.env.example](frontend/.env.example) et [deploy/](deploy/). En staging/production, `SECRET_KEY` doit être généré (`openssl rand -hex 32`) et `EMAIL_BACKEND=smtp` configuré avec SPF/DKIM (SEC-05).
