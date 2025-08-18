# Production Deployment (Vercel + Heroku + PageKite)

This guide documents the production topology and the constraints we adhere to.

## Topology
- Frontend: Vercel (Next.js App Router)
- Backend: Heroku (NestJS)
- AI Provider: OpenAI (SaaS) or Ollama via PageKite tunnel
- DB: Heroku Postgres (prod) / SQLite (local)

## Environment flags you must set
- Heroku:
  - NODE_ENV=production
  - DATABASE_URL=postgres://...
  - DB_SYNC=true|false (prefer false once migrations are stable)
  - OPENAI_API_KEY=... (if using OpenAI)
  - OLLAMA_BASE_URL=https://<subdomain>.pagekite.me (if using Ollama)
  - ALLOW_RAG_IN_PROD=true|false (default false)
  - Optional: CORS_ORIGIN / FRONTEND_URL for extra domains
- Vercel:
  - NEXT_PUBLIC_API_BASE=https://<heroku-app>.herokuapp.com (optional; frontend can also discover via public/config.json)

## CORS and Base URL discovery
- Backend CORS allows common localhosts and *.vercel.app. Add more via CORS_ORIGIN/FRONTEND_URL.
- Frontend Axios discovers the backend URL by fetching `/config.json` when env is missing.

## Health and Analytics
- UI status reads from `/reports/health`.
- Performance data comes from `/reports/performance` and `/reports/metrics`.
- All endpoints support timeframe parameters (e.g., ?timeframe=24h | 7d | 30d).

## RAG in production
- Disabled by default due to Heroku's ephemeral disk and 30s router limit.
- Set ALLOW_RAG_IN_PROD=true to enable. Ensure:
  - Upload storage is external/persistent or re-upload on each dyno restart.
  - Prompt/context limits are respected; model responses complete under ~28s.

## PageKite + Ollama
- Use the PageKite HTTPS URL in OLLAMA_BASE_URL.
- Backend upgrades HTTP→HTTPS and sets Host header automatically.
- A precheck to `/api/version` avoids slow failures; keep_alive set to 10m.

## Known constraints and tuning
- Heroku router timeout is 30s; backend sets model timeouts to ~28s.
- Keep RAG context small; chunk size ~400 with overlap ~60, top-3 chunks.
- Prefer OpenAI in production when strict latency is required.

## Postgres vs SQLite
- If DATABASE_URL is present and USE_SQLITE is not true, Postgres is used with SSL.
- USE_SQLITE=true forces SQLite (development convenience only).

Refer to docs/backend-setup-guide.md and docs/pagekite-setup.md for setup specifics.
