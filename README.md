# 🫕 Cooked Pad

Meme-native token launchpad by Cooked Labs.

## About Cooked Labs
Cooked Labs builds comedic capital markets — turning memes into products and businesses into jokes — with real utility, aligned incentives, and token utility from day one. Learn more at https://cooked.business.

## What is Cooked Pad?
Cooked Pad is a community-powered token launch platform designed for fair, transparent, and accessible creation across chains.
- Token creation with a streamlined flow
- Community funding with clear incentives
- Bonding curves for dynamic pricing
- Secure wallet integrations (Phantom + common wallets)
- Solana-first with cross-chain pathways via NEAR Intents & Omnibridge

## Monorepo Layout
```
cooked-pad/
├── app/       # Next.js frontend
├── backend/   # Bun/Hono backend API
└── README.md  # Root documentation
```

## Quickstart
1) Clone and enter the repo
```bash
git clone <your_repo_url>
cd cooked-pad
```
2) Install dependencies
```bash
# Frontend
cd app && pnpm install

# Backend
cd ../backend && bun install
```
3) Configure environment variables
```bash
# Frontend
cp app/.env.example app/.env

# Backend
cp backend/.env.example backend/.env
```
4) Start development
```bash
# Frontend
cd app && pnpm dev

# Backend
cd ../backend && bun run dev
```

## Tech Highlights
- Next.js 14 + TypeScript + TailwindCSS
- Bun + Hono API with TypeScript
- Solana tooling; cross-chain via NEAR Intents & Omnibridge

## Docs & Links
- Cooked Labs: https://cooked.business
- Launch mechanisms: bonding curves, fair launches, auctions

## Contributing
Open an issue or PR with clear context and scope.

## License
MIT