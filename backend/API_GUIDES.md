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

### Transactions Routes (`/api/transactions`)

#### Create Transaction
POST `/api/transactions`

Creates a transaction record for user activity (BUY/SELL) on a pool.

Request Body:
```json
{
  "userAddress": "11111111111111111111111111111112",
  "txHash": "5o7wV...abc123",
  "action": "BUY",
  "baseToken": "SOL",
  "quoteToken": "USDC",
  "amountIn": 10.5,
  "amountOut": 0.42,
  "pricePerToken": 25.0,
  "slippageBps": 50,
  "fee": 0.001,
  "feeToken": "SOL",
  "status": "pending",
  "chain": "solana",
  "poolAddress": "So11111111111111111111111111111111111111112"
}
```

Response:
```json
{
  "success": true,
  "transaction": {
    "id": "uuid-here",
    "userAddress": "11111111111111111111111111111112",
    "txHash": "5o7wV...abc123",
    "action": "BUY",
    "baseToken": "SOL",
    "quoteToken": "USDC",
    "amountIn": "10.5",
    "amountOut": "0.42",
    "pricePerToken": "25.0",
    "slippageBps": "50",
    "fee": "0.001",
    "feeToken": "SOL",
    "status": "pending",
    "chain": "solana",
    "poolAddress": "So11111111111111111111111111111111111111112",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### List Transactions
GET `/api/transactions`

Returns transactions optionally filtered by user and attributes.

Query Parameters:
- `userAddress` (optional): Filter by user address
- `action` (optional): `BUY` or `SELL`
- `baseToken` (optional): e.g., `SOL`
- `quoteToken` (optional): e.g., `USDC`
- `status` (optional): `pending`, `success`, or `failed`
- `chain` (optional): e.g., `solana`

Examples:
```bash
# List all transactions
curl "http://localhost:3001/api/transactions"

# Filter by user address
curl "http://localhost:3001/api/transactions?userAddress=11111111111111111111111111111112"

# Filter by action
curl "http://localhost:3001/api/transactions?action=BUY"

# Filter by status
curl "http://localhost:3001/api/transactions?status=success"
```

Response:
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid-here",
      "userAddress": "11111111111111111111111111111112",
      "txHash": "5o7wV...abc123",
      "action": "BUY",
      "baseToken": "SOL",
      "quoteToken": "USDC",
      "amountIn": "10.5",
      "amountOut": "0.42",
      "pricePerToken": "25.0",
      "slippageBps": "50",
      "fee": "0.001",
      "feeToken": "SOL",
      "status": "success",
      "chain": "solana",
      "poolAddress": "So11111111111111111111111111111111111111112",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Transactions by User Address
GET `/api/transactions/user/:address`

Example:
```bash
curl "http://localhost:3001/api/transactions/user/11111111111111111111111111111112"
```

Response:
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid-here",
      "userAddress": "11111111111111111111111111111112",
      "txHash": "5o7wV...abc123",
      "action": "BUY",
      "baseToken": "SOL",
      "quoteToken": "USDC",
      "amountIn": "10.5",
      "amountOut": "0.42",
      "pricePerToken": "25.0",
      "slippageBps": "50",
      "fee": "0.001",
      "feeToken": "SOL",
      "status": "success",
      "chain": "solana",
      "poolAddress": "So11111111111111111111111111111111111111112",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Transactions by Token Address (base or quote)
GET `/api/transactions/token/:address`

Example:
```bash
curl "http://localhost:3001/api/transactions/token/So11111111111111111111111111111111111111112"
```

Response:
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid-here",
      "userAddress": "11111111111111111111111111111112",
      "txHash": "5o7wV...abc123",
      "action": "SELL",
      "baseToken": "USDC",
      "quoteToken": "SOL",
      "amountIn": "100",
      "amountOut": "4",
      "pricePerToken": "25.0",
      "slippageBps": "50",
      "fee": "0.002",
      "feeToken": "SOL",
      "status": "pending",
      "chain": "solana",
      "poolAddress": "So11111111111111111111111111111111111111112",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Transaction by ID
GET `/api/transactions/:id`

Example:
```bash
curl "http://localhost:3001/api/transactions/uuid-here"
```

Response:
```json
{
  "success": true,
  "transaction": {
    "id": "uuid-here",
    "userAddress": "11111111111111111111111111111112",
    "txHash": "5o7wV...abc123",
    "action": "SELL",
    "baseToken": "SOL",
    "quoteToken": "USDC",
    "amountIn": "5.0",
    "amountOut": "0.20",
    "pricePerToken": "25.0",
    "slippageBps": "50",
    "fee": "0.0005",
    "feeToken": "SOL",
    "status": "pending",
    "chain": "solana",
    "poolAddress": "So11111111111111111111111111111111111111112",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Transaction Status
PATCH `/api/transactions/:id/status`

Request Body:
```json
{
  "status": "success"
}
```

Examples:
```bash
# Update status to success
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"status":"success"}' \
  "http://localhost:3001/api/transactions/uuid-here/status"

# Update status to failed
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"status":"failed"}' \
  "http://localhost:3001/api/transactions/uuid-here/status"
```

Response:
```json
{
  "success": true,
  "transaction": {
    "id": "uuid-here",
    "userAddress": "11111111111111111111111111111112",
    "txHash": "5o7wV...abc123",
    "action": "SELL",
    "baseToken": "SOL",
    "quoteToken": "USDC",
    "amountIn": "5.0",
    "amountOut": "0.20",
    "pricePerToken": "25.0",
    "slippageBps": "50",
    "fee": "0.0005",
    "feeToken": "SOL",
    "status": "success",
    "chain": "solana",
    "poolAddress": "So11111111111111111111111111111111111111112",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get All Tokens
**GET** `/api/tokens`

Retrieves all tokens with optional filtering.

**Query Parameters:**
- `launchpad` (optional): Filter by launchpad (`potlaunch` or `cookedpad`)
- `active` (optional): Filter by active status (`true` for trading/presale, `false` for ended/inactive)
- `tag` (optional): Filter by tag membership (token has this tag)
- `startDate` (optional): Filter tokens created on or after this date (ISO 8601 format)
- `endDate` (optional): Filter tokens created on or before this date (ISO 8601 format)

**Examples:**
```bash
# Get all tokens
curl "http://localhost:3001/api/tokens"

# Get tokens from specific launchpad
curl "http://localhost:3001/api/tokens?launchpad=potlaunch"

# Get only active tokens (trading/presale)
curl "http://localhost:3001/api/tokens?launchpad=potlaunch&active=true"

# Get inactive/ended tokens
curl "http://localhost:3001/api/tokens?launchpad=potlaunch&active=false"

# Get tokens containing a tag
curl "http://localhost:3001/api/tokens?launchpad=potlaunch&tag=meme"

# Get tokens by date range
curl "http://localhost:3001/api/tokens?launchpad=potlaunch&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z"

# Combine filters
curl "http://localhost:3001/api/tokens?launchpad=potlaunch&active=true&tag=defi&startDate=2024-01-01T00:00:00Z"
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
- `active` (optional): Filter by active status (`true` for active, `false` for inactive/ended)
- `tag` (optional): Filter by tag membership (token has this tag)
- `startDate` (optional): Filter tokens created on or after this date (ISO 8601 format)
- `endDate` (optional): Filter tokens created on or before this date (ISO 8601 format)

**Examples:**
```bash
# Basic search
curl "http://localhost:3001/api/tokens/search?q=bitcoin&launchpad=potlaunch"

# Search with owner filter
curl "http://localhost:3001/api/tokens/search?q=bitcoin&launchpad=potlaunch&owner=11111111111111111111111111111112"

# Search active tokens only
curl "http://localhost:3001/api/tokens/search?q=bitcoin&launchpad=potlaunch&active=true"

# Search inactive/ended tokens
curl "http://localhost:3001/api/tokens/search?q=bitcoin&launchpad=potlaunch&active=false"

# Search tokens with tag
curl "http://localhost:3001/api/tokens/search?q=bitcoin&launchpad=potlaunch&tag=meme"

# Search tokens by date range
curl "http://localhost:3001/api/tokens/search?q=bitcoin&launchpad=potlaunch&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z"

# Combine filters
curl "http://localhost:3001/api/tokens/search?q=bitcoin&launchpad=potlaunch&active=true&tag=defi&startDate=2024-01-01T00:00:00Z"
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
- `active` (optional): Filter by active status (`true` for active, `false` for inactive/ended)
- `tag` (optional): Filter by tag membership (token has this tag)
- `startDate` (optional): Filter tokens created on or after this date (ISO 8601 format)
- `endDate` (optional): Filter tokens created on or before this date (ISO 8601 format)

**Examples:**
```bash
# Get top 10 popular tokens
curl "http://localhost:3001/api/tokens/popular?launchpad=potlaunch"

# Get top 5 popular tokens from specific launchpad
curl "http://localhost:3001/api/tokens/popular?limit=5&launchpad=potlaunch"

# Popular active tokens only
curl "http://localhost:3001/api/tokens/popular?limit=20&launchpad=potlaunch&active=true"

# Popular inactive/ended tokens
curl "http://localhost:3001/api/tokens/popular?limit=20&launchpad=potlaunch&active=false"

# Popular tokens with tag
curl "http://localhost:3001/api/tokens/popular?limit=20&launchpad=potlaunch&tag=meme"

# Popular tokens by date range
curl "http://localhost:3001/api/tokens/popular?limit=20&launchpad=potlaunch&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z"

# Popular tokens combining filters
curl "http://localhost:3001/api/tokens/popular?limit=5&launchpad=potlaunch&active=true&tag=defi&startDate=2024-01-01T00:00:00Z"
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

#### Swap Tokens
**POST** `/api/halfbak/swap`

Creates a swap transaction on the DBC pool.

- `swapBaseForQuote=false` buys base token with quote
- `swapBaseForQuote=true` sells base token for quote

**Request Body:**
```json
{
  "baseMint": "11111111111111111111111111111112",
  "signer": "11111111111111111111111111111112",
  "amount": 1000000,
  "slippageBps": 100,
  "swapBaseForQuote": false,
  "computeUnitPriceMicroLamports": 0,
  "referralTokenAccount": "11111111111111111111111111111112"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": "base64-encoded-transaction",
    "baseMint": "11111111111111111111111111111112",
    "message": "Swap transaction created successfully"
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
