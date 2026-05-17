# LM Studio Dashboard

A browser-based dashboard for managing and monitoring a local LM Studio instance. Connects directly to LM Studio's OpenAI-compatible local API — no backend required. Works from any browser, including Android and Kali Linux.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server + dashboard (port 8080)
- `pnpm --filter @workspace/lm-studio-dashboard run build` — rebuild the dashboard static files (required after any dashboard source change)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (API server only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Dashboard: React + Vite, Tailwind CSS, wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/lm-studio-dashboard/src/` — dashboard React source
  - `lib/lm-studio.ts` — LM Studio API client (OpenAI-compatible, streaming)
  - `lib/connection.tsx` — connection status React context
  - `lib/theme.tsx` — dark/light mode toggle
  - `pages/Dashboard.tsx` — main overview with model count + server status
  - `pages/Models.tsx` — model listing table
  - `pages/Chat.tsx` — streaming chat interface
  - `pages/Settings.tsx` — server URL config + CORS instructions
- `artifacts/lm-studio-dashboard/dist/public/` — compiled dashboard static files (served by API server)
- `artifacts/api-server/src/app.ts` — Express app (serves `/api` routes + static dashboard files at `/`)

## Architecture decisions

- **Frontend-only dashboard**: All LM Studio calls go directly from the browser to LM Studio's API. The URL is stored in `localStorage` (default `http://localhost:1234`). No proxy needed.
- **Served through API server**: Due to a platform-level port detection issue with the dashboard artifact's workflow, the built dashboard static files are served by the API server at the root path `/`. The API server handles both `/api/*` (Express routes) and `/*` (static dashboard files).
- **Build-then-serve dev workflow**: After editing dashboard source files, run `pnpm --filter @workspace/lm-studio-dashboard run build` to rebuild. The API server serves the updated files immediately — no restart needed.
- **CORS requirement**: Users must enable CORS in LM Studio: Settings → Developer → Allow cross-origin requests. The Settings page in the dashboard explains this.

## Product

- **Dashboard**: Overview of LM Studio status — available models count, server reachability, active chat session.
- **Models**: Table of all loaded models with metadata.
- **Chat**: Streaming chat interface using LM Studio's `/v1/chat/completions` endpoint (Server-Sent Events).
- **Settings**: Configure the LM Studio server URL, with CORS setup instructions.
- **Theme**: Dark/light mode toggle. Space Mono font. Green accent color.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Dashboard workflow always shows "failed"**: This is a platform-level port detection issue specific to this artifact's workflow ID. The API server workflow handles serving the dashboard. Do not try to fix by changing ports — all ports fail.
- **After editing dashboard source**: Always run `pnpm --filter @workspace/lm-studio-dashboard run build` to update the served files.
- **CORS**: LM Studio must have "Allow cross-origin requests" enabled for the dashboard to connect.
- **BASE_PATH must be `/`**: The dashboard is built with `BASE_PATH=/` and served at root by the API server. Do not change this.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
