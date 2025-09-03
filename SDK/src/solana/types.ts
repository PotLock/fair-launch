import { PublicKey, Transaction, TransactionSignature } from "@solana/web3.js";
import BN from "bn.js";

export interface Wallet {
  readonly publicKey: PublicKey;
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
}

export interface PoolInfo {
  readonly poolId: PublicKey;
  readonly tokenA: PublicKey;
  readonly tokenB: PublicKey;
  readonly lpMint: PublicKey;
  readonly aVault: PublicKey;
  readonly bVault: PublicKey;
  readonly reserveA: BN;
  readonly reserveB: BN;
  readonly lpSupply: BN;
  readonly feeNumerator: BN;
  readonly feeDenominator: BN;
  readonly ratio: number;
}

export interface PoolKeys {
  readonly id: PublicKey;
  readonly lpMint: PublicKey;
  readonly aVault: PublicKey;
  readonly bVault: PublicKey;
  readonly authority: PublicKey;
  readonly marketId: PublicKey;
  readonly marketAuthority: PublicKey;
  readonly targetOrders: PublicKey;
  readonly withdrawQueue: PublicKey;
  readonly tempLp: PublicKey;
}

export interface TransactionResult {
  readonly signature: TransactionSignature;
  readonly status: 'success' | 'error';
  readonly error?: string;
  readonly poolId?: PublicKey;
}

export interface TokenInfo {
  readonly mint: PublicKey;
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly supply: number;
}

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}
