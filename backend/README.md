# 🫕 POTLAUNCH Backend

REST API server for the POTLAUNCH token launch platform.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod
- **Storage**: Filebase (IPFS)
- **Blockchain**: Solana Web3.js, Meteora SDK, Halfbaked SDK

## Project Structure

```
backend/
├── src/
│   ├── configs/       # Configuration files
│   ├── lib/           # Utility libraries
│   ├── routes/        # API route handlers
│   ├── services/      # Business logic
│   └── types/         # TypeScript types
├── db/                # Database schema and migrations
├── drizzle/           # Migration files
├── index.ts           # Server entry point
└── drizzle.config.ts  # Drizzle configuration
```

## Getting Started

### Prerequisites

- Bun 1.0+
- PostgreSQL 14+

### Installation

```bash
bun install
```

### Environment Setup

```bash
cp env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/potlaunch

# Filebase (IPFS)
FILEBASE_API_KEY=your_api_key
FILEBASE_API_SECRET=your_api_secret
FILEBASE_BUCKET_NAME=your_bucket
FILEBASE_GATEWAY=https://gateway.filebase.io/ipfs/

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Server
PORT=3001
```

### Database Setup

```bash
# Generate migrations
bun run db:generate

# Run migrations
bun run db:push
```

### Development

```bash
bun run dev
```

Server runs at http://localhost:3001

### Production

```bash
bun run start
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start with hot reload |
| `bun run start` | Start production server |
| `bun run test` | Run tests |
| `bun run db:generate` | Generate migrations |
| `bun run db:push` | Run migrations |

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Server status |

### Tokens

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tokens` | Create token |
| GET | `/api/tokens` | List tokens |
| GET | `/api/tokens/:id` | Get by ID |
| GET | `/api/tokens/mint/:address` | Get by mint address |
| GET | `/api/tokens/search` | Search tokens |
| GET | `/api/tokens/address/:address` | Get by owner |
| GET | `/api/tokens/popular` | Popular tokens |
| GET | `/api/tokens/holders/:mintAddress` | Token holders |
| DELETE | `/api/tokens/:id` | Delete token |

### IPFS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ipfs/upload-image` | Upload image |
| POST | `/api/ipfs/upload-metadata` | Upload metadata |
| GET | `/api/ipfs/health` | Service status |

### Halfbak

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/halfbak/dbc-config` | Create DBC config |
| POST | `/api/halfbak/deploy-token` | Deploy token |
| GET | `/api/halfbak/pool/state/:mint` | Pool state |
| GET | `/api/halfbak/pool/config/:mint` | Pool config |
| GET | `/api/halfbak/pool/metadata/:mint` | Pool metadata |
| GET | `/api/halfbak/pool/curve-progress/:mint` | Curve progress |

## Query Parameters

### Token Filtering

| Parameter | Type | Description |
|-----------|------|-------------|
| `launchpad` | string | Filter by launchpad (potlaunch, cookedpad) |
| `active` | boolean | Filter by active status |
| `tag` | string | Filter by tag |
| `owner` | string | Filter by owner address |
| `limit` | number | Result limit (1-100) |

### Search

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (required) |

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error

```json
{
  "success": false,
  "message": "Error description"
}
```

## Database Schema

### tokens

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | string | Token name |
| symbol | string | Token symbol |
| description | text | Description |
| totalSupply | string | Total supply |
| decimals | integer | Decimal places |
| mintAddress | string | Solana mint address |
| owner | string | Owner wallet |
| launchpad | string | Launch platform |
| tokenUri | string | Metadata URI |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update |

### token_allocations

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tokenId | uuid | Foreign key to tokens |
| percentage | decimal | Allocation percentage |
| walletAddress | string | Recipient wallet |
| lockupPeriod | integer | Lock duration |
| vestingEnabled | boolean | Vesting enabled |

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `hono` | Web framework |
| `drizzle-orm` | Database ORM |
| `@solana/web3.js` | Solana interaction |
| `@meteora-ag/dynamic-bonding-curve-sdk` | Bonding curves |
| `@cookedbusiness/halfbaked-sdk` | Token deployment |
| `@filebase/sdk` | IPFS storage |
| `zod` | Schema validation |

## License

MIT
