
# Fair launch mechanism across different chains starting with Solana

A Solana smart contract implementing customizable bonding curves with fee distribution and liquidity management capabilities.

## Overview

This smart contract implements an launchpad using bonding curves. It supports multiple curve types, fee collection and distribution, and liquidity management features.

## Features

### Bonding Curve Types
- **Linear Curve**: Price increases linearly with supply
- **Quadratic Curve**: Price increases quadratically with supply

### Core Functionality
1. **Buy Tokens**
   - Calculate token price based on selected curve type
   - Apply fees
   - Update reserves and supply
   - Distribute fees to configured recipients

2. **Sell Tokens**
   - Calculate token value based on selected curve type
   - Apply fees
   - Update reserves and supply
   - Distribute fees to configured recipients

3. **Liquidity Management**
   - Add liquidity with configurable lock periods
   - Remove liquidity after lock period expires

### Fee Management
- Configurable fee percentage (basis points)
- Multiple fee recipients with customizable share ratios
- Claimable accumulated fees for recipients

### Governance



## How to test 

1. Install 
```
yarn install
```

2. Add your private key in the config folder
2.1 Signer on `~/.config/solana/id.json` (default signer for anchor config)


2.2 Fee Recipient on `~/.config/solana/id2.json` and `~/.config/solana/id3.json`


2. Run script to create token

Noted: Fill the `SIGNER_PRIVATE_KEY` and `USER_PRIVATE_KEY` in the `.env` file

```
yarn create-token
```

Result

```
Mint: 3YChZhQqYpriRAiNunKLRxF5jnTuj97RE4SHBBHNAJsu
ATA: 5ZoKnNrLwDw5FSgjuA7S7uSEsYPDHrhPzQ7bUTZxdtSa
```

3. Run tests

Noted: Replace your mint account in the `tests/bonding-curve.ts` file

```js
const mint = new PublicKey("3YChZhQqYpriRAiNunKLRxF5jnTuj97RE4SHBBHNAJsu");
```

Run test 
```
anchor test
```

