# 🫕 Cooked Pad — Frontend

App for Cooked Pad by Cooked Labs.

## Overview
Cooked Pad’s frontend delivers the experience for creating tokens, browsing launches, tracking portfolios, and community discovery.

## Stack
- Next.js 14 + TypeScript
- TailwindCSS
- Wallet adapters (Phantom + others)
- Deployed via Vercel or custom infra

## Requirements
- Node.js 18+
- PNPM

## Setup
```bash
pnpm install
cp .env.example .env
pnpm dev
```
Open `http://localhost:3000`.

## Scripts
- `pnpm dev` — Run dev server
- `pnpm build` — Build production bundle
- `pnpm start` — Start production server
- `pnpm lint` — Run Biome checks
- `pnpm format` — Format with Biome

## Key Paths
- `src/app/layout.tsx` — App-wide metadata and theming
- `src/app/page.tsx` — Home page
- `src/app/token/` — Token list, details, and portfolio pages
- `public/manifest.json` — PWA metadata

## Branding
Metadata and canonical URLs reflect Cooked Pad and Cooked Labs under `https://cooked.business`.

## Deployment
- Vercel/Netlify or containers
- Configure environment variables and secrets per platform

## License
MIT