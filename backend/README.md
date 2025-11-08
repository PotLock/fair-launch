# POTLAUNCH Backend

## Features

- ✅ Store token information with complete metadata
- ✅ Manage allocation and vesting schedules
- ✅ RESTful API with validation
- ✅ Use Drizzle ORM with PostgreSQL
- ✅ IPFS integration for metadata storage
- ✅ Halfbak SDK integration for DBC configuration
- ✅ Multi-launchpad support (potlaunch, cookedpad)

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

## API Documentation

### Token Routes (`/api/tokens`)

#### Create Token
**POST** `/api/tokens`

Creates a new token with integrated DBC configuration.

**Request Body:**
```json
{
  "name": "My Token",
  "symbol": "MTK",
  "description": "A sample token for demonstration",
  "totalSupply": "1000000000",
  "decimals": "9",
  "mintAddress": "11111111111111111111111111111112",
  "owner": "11111111111111111111111111111112",
  "launchpad": "potlaunch",
  "tokenUri": "https://example.com/token.json",
  "bannerUri": "https://example.com/banner.png",
  "website": "https://example.com",
  "twitter": "https://twitter.com/example",
  "telegram": "https://t.me/example",
  "tokenConfig": {
    "quoteMint": "So11111111111111111111111111111111111111112",
    "dbcConfig": {
      "buildCurveMode": 0,
      "totalTokenSupply": 1000000000,
      "migrationOption": 0,
      "tokenBaseDecimal": 9,
      "tokenQuoteDecimal": 9,
      "dynamicFeeEnabled": false,
      "activationType": 0,
      "collectFeeMode": 0,
      "migrationFeeOption": 0,
      "tokenType": 0,
      "partnerLpPercentage": 0,
      "creatorLpPercentage": 100,
      "partnerLockedLpPercentage": 0,
      "creatorLockedLpPercentage": 0,
      "creatorTradingFeePercentage": 0,
      "leftover": 0,
      "tokenUpdateAuthority": 0,
      "leftoverReceiver": "11111111111111111111111111111112",
      "feeClaimer": "11111111111111111111111111111112",
      "lockedVestingParam": {
        "totalLockedVestingAmount": 0,
        "numberOfVestingPeriod": 0,
        "cliffUnlockAmount": 0,
        "totalVestingDuration": 0,
        "cliffDurationFromMigrationTime": 0
      },
      "baseFeeParams": {
        "baseFeeMode": 0
      },
      "migrationFee": {
        "feePercentage": 5,
        "creatorFeePercentage": 100
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "My Token",
    "symbol": "MTK",
    "description": "A sample token for demonstration",
    "totalSupply": "1000000000",
    "decimals": 9,
    "mintAddress": "11111111111111111111111111111112",
    "owner": "11111111111111111111111111111112",
    "launchpad": "potlaunch",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Token and DBC config created successfully"
}
```

#### Get All Tokens
**GET** `/api/tokens`

Retrieves all tokens with optional filtering.

**Query Parameters:**
- `launchpad` (optional): Filter by launchpad (`potlaunch` or `cookedpad`)
- `active` (optional): Filter by active status (`true` or `false`)
- `tag` (optional): Filter by tag membership (token has this tag)

**Examples:**
```bash
# Get all tokens
curl "http://localhost:3001/api/tokens"

# Get tokens from specific launchpad
curl "http://localhost:3001/api/tokens?launchpad=potlaunch"

# Get only active tokens
curl "http://localhost:3001/api/tokens?active=true"

# Get tokens containing a tag
curl "http://localhost:3001/api/tokens?tag=meme"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "My Token",
      "symbol": "MTK",
      "description": "A sample token",
      "totalSupply": "1000000000",
      "decimals": 9,
      "mintAddress": "11111111111111111111111111111112",
      "owner": "11111111111111111111111111111112",
      "launchpad": "potlaunch",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Token by ID
**GET** `/api/tokens/:id`

Retrieves a specific token by its ID.

**Example:**
```bash
curl "http://localhost:3001/api/tokens/uuid-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "My Token",
    "symbol": "MTK",
    "description": "A sample token",
    "totalSupply": "1000000000",
    "decimals": 9,
    "mintAddress": "11111111111111111111111111111112",
    "owner": "11111111111111111111111111111112",
    "launchpad": "potlaunch",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "metadata": {
      "tokenUri": "https://example.com/token.json",
      "bannerUri": "https://example.com/banner.png",
      "website": "https://example.com",
      "twitter": "https://twitter.com/example",
      "telegram": "https://t.me/example"
    }
  }
}
```

#### Get Token by Mint Address
**GET** `/api/tokens/mint/:address`

Retrieves a token by its mint address.

**Example:**
```bash
curl "http://localhost:3001/api/tokens/mint/11111111111111111111111111111112"
```

#### Search Tokens
**GET** `/api/tokens/search`

Search tokens by name, symbol, or description.

**Query Parameters:**
- `q` (required): Search query
- `owner` (optional): Filter by owner address
- `launchpad` (optional): Filter by launchpad (`potlaunch` or `cookedpad`)
- `active` (optional): Filter by active status (`true` or `false`)
- `tag` (optional): Filter by tag membership (token has this tag)

**Examples:**
```bash
# Basic search
curl "http://localhost:3001/api/tokens/search?q=bitcoin"

# Search with owner filter
curl "http://localhost:3001/api/tokens/search?q=bitcoin&owner=11111111111111111111111111111112"

# Search with launchpad filter
curl "http://localhost:3001/api/tokens/search?q=bitcoin&launchpad=potlaunch"

# Search active tokens
curl "http://localhost:3001/api/tokens/search?q=bitcoin&active=true"

# Search tokens with tag
curl "http://localhost:3001/api/tokens/search?q=bitcoin&tag=meme"

# Combine filters
curl "http://localhost:3001/api/tokens/search?q=bitcoin&launchpad=cookedpad&active=false&tag=defi"
```

#### Get Tokens by Owner
**GET** `/api/tokens/address/:address`

Retrieves all tokens owned by a specific address.

**Example:**
```bash
curl "http://localhost:3001/api/tokens/address/11111111111111111111111111111112"
```

#### Get Popular Tokens
**GET** `/api/tokens/popular`

Retrieves popular tokens with optional filtering.

**Query Parameters:**
- `limit` (optional): Number of tokens to return (1-100, default: 10)
- `launchpad` (optional): Filter by launchpad (`potlaunch` or `cookedpad`)
- `active` (optional): Filter by active status (`true` or `false`)
- `tag` (optional): Filter by tag membership (token has this tag)

**Examples:**
```bash
# Get top 10 popular tokens
curl "http://localhost:3001/api/tokens/popular"

# Get top 5 popular tokens from specific launchpad
curl "http://localhost:3001/api/tokens/popular?limit=5&launchpad=potlaunch"

# Popular active tokens
curl "http://localhost:3001/api/tokens/popular?active=true"

# Popular tokens with tag
curl "http://localhost:3001/api/tokens/popular?tag=meme"

# Popular tokens combining filters
curl "http://localhost:3001/api/tokens/popular?limit=5&launchpad=potlaunch&active=true&tag=defi"
```

#### Get Token Holders
**GET** `/api/tokens/holders/:mintAddress`

Retrieves all holders of a specific token.

**Example:**
```bash
curl "http://localhost:3001/api/tokens/holders/11111111111111111111111111111112"
```

**Response:**
```json
{
  "success": true,
  "data": [
    "11111111111111111111111111111112",
    "22222222222222222222222222222223"
  ]
}
```

#### Delete Token
**DELETE** `/api/tokens/:id`

Deletes a specific token by its ID.

**Example:**
```bash
curl -X DELETE "http://localhost:3001/api/tokens/uuid-here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "message": "Token deleted successfully"
}
```

### IPFS Routes (`/api/ipfs`)

#### Upload Image
**POST** `/api/ipfs/upload-image`

Uploads an image file to IPFS via Filebase.

**Request (multipart/form-data):**
- `image` (file): Image file to upload
- `fileName` (optional): Custom filename

**Example:**
```bash
curl -X POST "http://localhost:3001/api/ipfs/upload-image" \
  -F "image=@/path/to/image.png" \
  -F "fileName=my-token-logo"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUri": "https://gateway.filebase.io/ipfs/QmHash..."
  },
  "message": "Image uploaded successfully"
}
```

#### Upload Metadata
**POST** `/api/ipfs/upload-metadata`

Uploads token metadata JSON to IPFS.

**Request Body:**
```json
{
  "name": "My Token",
  "symbol": "MTK",
  "imageUri": "https://gateway.filebase.io/ipfs/QmImageHash...",
  "bannerUri": "https://gateway.filebase.io/ipfs/QmBannerHash...",
  "description": "A sample token for demonstration",
  "website": "https://example.com",
  "twitter": "https://twitter.com/example",
  "telegram": "https://t.me/example"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUri": "https://gateway.filebase.io/ipfs/QmMetadataHash..."
  },
  "message": "Metadata uploaded successfully"
}
```

#### Health Check
**GET** `/api/ipfs/health`

Checks IPFS service status.

**Example:**
```bash
curl "http://localhost:3001/api/ipfs/health"
```

**Response:**
```json
{
  "success": true,
  "message": "IPFS service is running"
}
```

### Halfbak Routes (`/api/halfbak`)

#### Create DBC Configuration
**POST** `/api/halfbak/dbc-config`

Creates a DBC (Dynamic Bonding Curve) configuration transaction.

**Request Body:**
```json
{
  "metadata": {
    "name": "My Token",
    "symbol": "MTK",
    "description": "A sample token",
    "imageUri": "https://gateway.filebase.io/ipfs/QmHash...",
    "bannerUri": "https://gateway.filebase.io/ipfs/QmHash...",
    "website": "https://example.com",
    "twitter": "https://twitter.com/example",
    "telegram": "https://t.me/example"
  },
  "signer": "11111111111111111111111111111112"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dbcConfigKeypair": {
      "publicKey": "...",
      "secretKey": "..."
    },
    "transaction": "base64-encoded-transaction",
    "message": "DBC configuration transaction created successfully"
  }
}
```

#### Deploy Token
**POST** `/api/halfbak/deploy-token`

Creates a token deployment transaction.

**Request Body:**
```json
{
  "metadata": {
    "name": "My Token",
    "symbol": "MTK",
    "description": "A sample token",
    "imageUri": "https://gateway.filebase.io/ipfs/QmHash..."
  },
  "signer": "11111111111111111111111111111112",
  "dbcConfigKeypair": {
    "publicKey": {
      "0": 123,
      "1": 456,
      // ... 32 bytes total
    },
    "secretKey": {
      "0": 123,
      "1": 456,
      // ... 64 bytes total
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": "base64-encoded-transaction",
    "baseMint": "TokenMintAddress...",
    "message": "Token deployment transaction created successfully"
  }
}
```

#### Get Pool State
**GET** `/api/halfbak/pool/state/:mintAddress`

Retrieves pool state information for a token.

**Example:**
```bash
curl "http://localhost:3001/api/halfbak/pool/state/11111111111111111111111111111112"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "poolState": "pool state data..."
  }
}
```

#### Get Pool Configuration
**GET** `/api/halfbak/pool/config/:mintAddress`

Retrieves pool configuration for a token.

**Example:**
```bash
curl "http://localhost:3001/api/halfbak/pool/config/11111111111111111111111111111112"
```

#### Get Pool Metadata
**GET** `/api/halfbak/pool/metadata/:mintAddress`

Retrieves pool metadata for a token.

**Example:**
```bash
curl "http://localhost:3001/api/halfbak/pool/metadata/11111111111111111111111111111112"
```

#### Get Pool Curve Progress
**GET** `/api/halfbak/pool/curve-progress/:mintAddress`

Retrieves curve progress information for a token pool.

**Example:**
```bash
curl "http://localhost:3001/api/halfbak/pool/curve-progress/11111111111111111111111111111112"
```

### Health Check

**GET** `/`

Checks server status.

**Example:**
```bash
curl "http://localhost:3001/"
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running"
}
```

## Error Responses

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad Request (validation errors, missing parameters)
- `404` - Not Found
- `500` - Internal Server Error

### Validation Errors

When validation fails, the response includes detailed error information:

```json
{
  "success": false,
  "message": "Validation error: Name is required, Symbol must be at least 1 character"
}
```

## Environment Variables

Required environment variables for the application:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/potlaunch

# Filebase (IPFS)
FILEBASE_API_KEY=your_filebase_api_key
FILEBASE_API_SECRET=your_filebase_api_secret
FILEBASE_BUCKET_NAME=your_bucket_name
FILEBASE_GATEWAY=https://gateway.filebase.io/ipfs/

# Solana RPC (for token holder queries)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Server
PORT=3001
```

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
