import { ConfirmOptions, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export const DEFAULT_RPC = "https://api.devnet.solana.com";

export const RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4 = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8") as Readonly<PublicKey>;
export const RAYDIUM_AMM_AUTHORITY = new PublicKey("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1") as Readonly<PublicKey>;

export const POOL_ACCOUNT_SPACE = 752 as const;
export const LP_MINT_DECIMALS = 9 as const;
export const DEFAULT_SLIPPAGE = 0.02 as const;
export const FEE_NUMERATOR = new BN(25);
export const FEE_DENOMINATOR = new BN(10000);

export const CONFIRMATION_OPTIONS: ConfirmOptions = { commitment: "confirmed" } as const;
export const DEFAULT_AIRDROP_AMOUNT = 2; // SOL
export const DEFAULT_TOKEN_DECIMALS = 9;
