import { PublicKey } from "@solana/web3.js";
import { RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4 } from './constants';
import { PoolKeys } from './types';
import { validateTokenAddress } from './utils';

const pdaCache = new Map<string, PublicKey>();

const findPDAWithCache = (
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
): PublicKey => {
  const key = seeds.map(s => Buffer.from(s).toString('hex')).join(':') + ':' + programId.toBase58();

  if (pdaCache.has(key)) {
    return pdaCache.get(key)!;
  }

  const [pda] = PublicKey.findProgramAddressSync(seeds, programId);
  pdaCache.set(key, pda);
  return pda;
};

export const findAssociatedPoolKeys = (tokenA: string, tokenB: string): PoolKeys => {
  validateTokenAddress(tokenA, "tokenA");
  validateTokenAddress(tokenB, "tokenB");

  const tokenAMint = new PublicKey(tokenA);
  const tokenBMint = new PublicKey(tokenB);

  // Derive AMM authority
  const authority = findPDAWithCache(
    [Buffer.from("amm_associated_authority")],
    RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
  );

  // Derive pool ID
  const id = findPDAWithCache(
    [
      RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4.toBuffer(),
      tokenAMint.toBuffer(),
      tokenBMint.toBuffer(),
      Buffer.from("pool_seed")
    ],
    RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
  );

  // Derive LP mint
  const lpMint = findPDAWithCache(
    [id.toBuffer(), Buffer.from("lp_mint")],
    RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
  );

  // Derive token vaults
  const aVault = findPDAWithCache(
    [id.toBuffer(), tokenAMint.toBuffer()],
    RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
  );

  const bVault = findPDAWithCache(
    [id.toBuffer(), tokenBMint.toBuffer()],
    RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
  );

  // Derive market-related PDAs
  const marketId = findPDAWithCache(
    [id.toBuffer(), Buffer.from("market")],
    RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
  );

  const marketAuthority = findPDAWithCache(
    [marketId.toBuffer()],
    RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
  );

  // Derive additional pool PDAs
  const targetOrders = findPDAWithCache(
    [id.toBuffer(), Buffer.from("target_orders")],
    RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
  );

  const withdrawQueue = findPDAWithCache(
    [id.toBuffer(), Buffer.from("withdraw_queue")],
    RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
  );

  const tempLp = findPDAWithCache(
    [id.toBuffer(), Buffer.from("temp_lp")],
    RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
  );

  return {
    id,
    lpMint,
    aVault,
    bVault,
    authority,
    marketId,
    marketAuthority,
    targetOrders,
    withdrawQueue,
    tempLp
  };
};

export const clearPDACache = (): void => {
  pdaCache.clear();
};

export const getPDACacheSize = (): number => {
  return pdaCache.size;
};
