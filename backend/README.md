# 🫕 Cooked Pad — Backend

Backend API for Cooked Pad by Cooked Labs.

## Overview
Bun/Hono services powering token creation, listings, analytics, and portfolio endpoints consumed by the frontend.

## Stack
- Bun
- Hono
- TypeScript
- Postgres (via Drizzle ORM)

## Requirements
- Bun
- Postgres (optional for local dev)

## Setup
```bash
bun install
cp .env.example .env
bun run dev
```
Default dev server: `http://localhost:3001` (see `index.ts`).

## Scripts
- `bun run dev` — Start dev server
- `bun run start` — Start production server
- `bun run db:generate` — Generate migrations
- `bun run db:push` — Push schema

## Key Paths
- `index.ts` — Server entry
- `src/routes/` — Hono route handlers
- `db/schema.ts` — Drizzle schema
- `db/connection.ts` — DB connection

## Endpoints
- `GET /health` — Health check
- `GET /token` — Token list
- `GET /token/:address` — Token detail
- `GET /me` — Portfolio summary

## Deployment
- Vercel/Workers or containerized infra
- Configure secrets via platform settings

## License
MIT