# 🫕 POTLAUNCH App

Frontend application for the POTLAUNCH token launch platform.

## Tech Stack

- **Framework**: Next.js 15 with Turbopack
- **Language**: TypeScript 5
- **UI**: React 19, Tailwind CSS 4, Radix UI
- **State**: SWR, TanStack Query
- **Animation**: Framer Motion, GSAP
- **Wallets**:
  - Solana Wallet Adapter (Phantom, etc.)
  - NEAR Wallet Selector
  - Rainbow Kit (EVM chains)
- **Blockchain SDKs**:
  - Meteora Dynamic Bonding Curve SDK
  - Halfbaked SDK
  - Omni Bridge SDK
  - Solana Web3.js
  - NEAR JS Client

## Project Structure

```
app/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   ├── configs/       # Configuration files
│   ├── constants/     # Application constants
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility libraries
│   ├── types/         # TypeScript types
│   └── utils/         # Helper utilities
├── public/            # Static assets
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
pnpm install
```

### Environment Setup

```bash
cp .env.example .env
```

Required environment variables:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_NEAR_NETWORK_ID=mainnet
```

### Development

```bash
pnpm dev
```

Server runs at http://localhost:3000

### Build

```bash
pnpm build
```

### Production

```bash
pnpm start
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Format code with Biome |

## Features

- Token creation and deployment
- Dynamic bonding curve configuration
- Cross-chain token bridging (Solana <-> NEAR)
- Wallet connection for multiple chains
- Real-time price charts
- Token search and discovery
- IPFS metadata upload

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@solana/web3.js` | Solana blockchain interaction |
| `@meteora-ag/dynamic-bonding-curve-sdk` | Bonding curve operations |
| `@near-wallet-selector/*` | NEAR wallet integration |
| `omni-bridge-sdk` | Cross-chain bridging |
| `@cookedbusiness/halfbaked-sdk` | Token deployment |
| `recharts` | Price charts |
| `framer-motion` | Animations |

## License

MIT
