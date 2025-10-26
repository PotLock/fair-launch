# POTLAUNCH Backend

## Features

- ✅ Store token information with complete metadata
- ✅ Manage allocation and vesting schedules
- ✅ RESTful API with validation
- ✅ Use Drizzle ORM with PostgreSQL

## Installation

1. **Clone repository and install dependencies:**
```bash
cd backend
bun install
```

2. **Configure database:**
```bash
# Copy env.example file
cp env.example .env

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost:5432/fair_launch
```

3. **Generate and run migrations:**
```bash
# Generate migration files
bun run db:generate

# Run migrations
bun run db:migrate
```

## Running the Application

### Development
```bash
bun run dev
```

### Production
```bash
bun run start
```

Server will run at `http://localhost:3001`

## API Endpoints

### Tokens

- `POST /api/tokens` - Create new token
- `GET /api/tokens` - Get all tokens list
- `GET /api/tokens/:id` - Get token information by ID
- `PUT /api/tokens/:id` - Update token
- `DELETE /api/tokens/:id` - Delete token
- `DELETE /api/tokens/all` - Delete all token

### Health Check

- `GET /` - Check server status

## Database Schema

### `tokens` Table
Store main token information:
- Basic information (name, symbol, description, supply, decimals)
- Social links (website, twitter, telegram, discord, farcaster)
- Pricing mechanism (initialPrice, finalPrice, targetRaise, reserveRatio, curveType)
- DEX listing 
- Fees (mintFee, transferFee, burnFee, feeRecipientAddress)
- Sale setup (softCap, hardCap, scheduleLaunch, etc.)
- Admin setup (revokeMintAuthority, revokeFreezeAuthority, etc.)

### `token_allocations` Table
Store allocation and vesting information:
- Token distribution (percentage, walletAddress, lockupPeriod)
- Vesting parameters (enabled, percentage, cliff, duration, interval)

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── schema.ts          # Database schema
│   │   └── connection.ts      # Database connection
│   ├── services/
│   │   └── tokenService.ts    # Business logic
│   ├── routes/
│   │   └── tokenRoutes.ts     # API routes
│   └── types/
│       └── index.ts           # Type definitions
├── drizzle/                   # Migration files
├── index.ts                   # Server entry point
├── drizzle.config.ts          # Drizzle configuration
└── package.json
```

## Scripts

- `bun run dev` - Run development server with hot reload
- `bun run start` - Run production server
- `bun run db:generate` - Generate migration files
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open Drizzle Studio to view database
