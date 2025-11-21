# 🫕 POTLAUNCH

**Cross-chain token launch kit powered by Solana x NEAR Intents x Omnibridge**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-000000?style=flat&logo=solana&logoColor=white)](https://solana.com/)
[![NEAR Protocol](https://img.shields.io/badge/NEAR-000000?style=flat&logo=near&logoColor=white)](https://near.org/)

## About PotLock

**POTLOCK** is the open funding stack supercharged by AI, building the future of decentralized funding and impact tracking. Founded by Potluck Labs with contracts deployed by Potlock Foundation DAO, PotLock provides a comprehensive ecosystem for community-powered token launches, grants, and impact tracking.

### PotLock Ecosystem

PotLock operates across multiple blockchain networks and provides various tools and platforms:

- **NEAR Protocol** - Core infrastructure and BOS applications
- **Stellar (Soroban Contracts)** - GrantPicks voting mechanism
- **Base/Cyber** - Activity DAO via Commit Protocol
- **Solana** - Token launchpad and bonding curves

## About POTLAUNCH

POTLAUNCH is a community-powered token launch platform that enables fair, transparent, and accessible token creation across multiple blockchains. Built on Solana with cross-chain capabilities through NEAR Intents and Omnibridge.

### Key Features

- **Token Creation** - Create and launch tokens with customizable parameters
- **Bonding Curves** - Dynamic bonding curve models via Meteora SDK
- **Cross-chain Support** - Bridge tokens between Solana and NEAR ecosystems
- **Fair Launch** - Dutch auctions, bonding curves, and customizable launch options
- **Multi-wallet Support** - Phantom, NEAR wallets, and Rainbow Kit integration

## Project Structure

```
potlaunch/
├── app/                # Next.js frontend application
├── backend/            # Hono + Bun backend API
└── docs/               # Nextra documentation site
```

| Directory | Description | Tech Stack |
|-----------|-------------|------------|
| `app/` | Frontend application | Next.js 15, React 19, Tailwind CSS 4 |
| `backend/` | REST API server | Bun, Hono, Drizzle ORM, PostgreSQL |
| `docs/` | Documentation site | Next.js 16, Nextra, Mantine |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (for app)
- Bun (for backend)
- Yarn 4+ (for docs)
- PostgreSQL (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/PotLock/potlaunch.git
cd potlaunch

# Install app dependencies
cd app && pnpm install

# Install backend dependencies
cd ../backend && bun install

# Install docs dependencies
cd ../docs && yarn install
```

### Environment Setup

```bash
# App
cp app/.env.example app/.env

# Backend
cp backend/env.example backend/.env
```

### Development

```bash
# Start frontend (in app/)
pnpm dev

# Start backend (in backend/)
bun run dev

# Start docs (in docs/)
yarn dev
```

### Ports

| Service | Port | URL |
|---------|------|-----|
| App | 3000 | http://localhost:3000 |
| Backend | 3001 | http://localhost:3001 |
| Docs | 3002 | http://localhost:3002 |

## Documentation

- [Introduction](https://docs.potlaunch.com)
- [Quick Start Guide](https://docs.potlaunch.com/quick-start)
- [User Guide](https://docs.potlaunch.com/user-guide)
- [Developer Guide](https://docs.potlaunch.com/developer-guide)
- [API Reference](./backend/README.md)

## Live Environments

| Environment | URL |
|-------------|-----|
| Production | [potlaunch.com](https://potlaunch.com) |
| Testnet | [testnet.potlaunch.com](https://testnet.potlaunch.com) |
| Staging | [staging.potlaunch.com](https://staging.potlaunch.com) |

## Tech Stack

### Frontend (app/)
- Next.js 15 with Turbopack
- React 19
- Tailwind CSS 4
- Radix UI primitives
- Solana Wallet Adapter
- NEAR Wallet Selector
- Rainbow Kit (EVM wallets)
- Meteora Dynamic Bonding Curve SDK
- Omni Bridge SDK

### Backend (backend/)
- Bun runtime
- Hono web framework
- Drizzle ORM
- PostgreSQL
- Zod validation
- Filebase (IPFS)
- Halfbaked SDK

### Documentation (docs/)
- Next.js 16
- Nextra 4
- Mantine UI 8
- MDX content

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## PotLock Ecosystem

POTLAUNCH is part of the [PotLock](https://potlock.org) ecosystem - the open funding stack supercharged by AI.

### Related Projects

- [PotLock App](https://app.potlock.org) - Main funding application
- [GrantPicks](https://grantpicks.com) - Grant voting mechanism
- [NadaBot](https://nada.bot) - Sybil resistance
- [AIPGF](https://aipgf.com) - AI-powered public goods funding

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built by [PotLock Labs](https://potlock.org)
