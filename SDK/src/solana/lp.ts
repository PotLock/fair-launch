import {
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";

import {
  DEFAULT_SLIPPAGE,
  FEE_DENOMINATOR,
  FEE_NUMERATOR,
  POOL_ACCOUNT_SPACE,
  RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
} from './constants';
import { logger } from './logger';
import { findAssociatedPoolKeys } from './pda';
import { sendAndConfirmTransactionWithRetry } from './transactions';
import { PoolInfo, Result, TransactionResult, Wallet } from './types';
import { bnToBuffer, bnToNumber, connection, numberToBN, validateTokenAddress } from './utils';


export async function checkIfPoolExists(tokenA: string, tokenB: string): Promise<boolean> {
  try {
    logger.debug("Checking pool existence", { tokenA, tokenB });

    const poolKeys = findAssociatedPoolKeys(tokenA, tokenB);
    const accountInfo = await connection.getAccountInfo(poolKeys.id);

    const exists = accountInfo !== null && accountInfo.data.length > 0;
    logger.info("Pool existence check completed", {
      tokenA,
      tokenB,
      exists,
      poolId: poolKeys.id.toBase58()
    });

    return exists;
  } catch (error) {
    logger.error("Error checking pool existence", {
      tokenA,
      tokenB,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}


export async function getPoolInfo(tokenA: string, tokenB: string): Promise<Result<PoolInfo>> {
  try {
    logger.debug("Getting pool info", { tokenA, tokenB });

    const exists = await checkIfPoolExists(tokenA, tokenB);
    if (!exists) {
      return { success: false, error: new Error("Pool does not exist") };
    }

    const poolKeys = findAssociatedPoolKeys(tokenA, tokenB);

    const [aVaultInfo, bVaultInfo, lpMintInfo] = await Promise.all([
      getAccount(connection, poolKeys.aVault),
      getAccount(connection, poolKeys.bVault),
      getMint(connection, poolKeys.lpMint)
    ]);

    const reserveA = new BN(aVaultInfo.amount.toString());
    const reserveB = new BN(bVaultInfo.amount.toString());
    const ratio = bnToNumber(reserveA) / bnToNumber(reserveB);

    const poolInfo: PoolInfo = {
      poolId: poolKeys.id,
      tokenA: new PublicKey(tokenA),
      tokenB: new PublicKey(tokenB),
      lpMint: poolKeys.lpMint,
      aVault: poolKeys.aVault,
      bVault: poolKeys.bVault,
      reserveA,
      reserveB,
      lpSupply: new BN(lpMintInfo.supply.toString()),
      feeNumerator: FEE_NUMERATOR,
      feeDenominator: FEE_DENOMINATOR,
      ratio
    };

    logger.info("Pool info retrieved successfully", {
      poolId: poolKeys.id.toBase58(),
      reserveA: bnToNumber(reserveA),
      reserveB: bnToNumber(reserveB),
      ratio
    });

    return { success: true, data: poolInfo };
  } catch (error) {
    logger.error("Error getting pool info", {
      tokenA,
      tokenB,
      error: error instanceof Error ? error.message : String(error)
    });
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}


export async function createPool(
  tokenA: string,
  tokenB: string,
  wallet: Wallet
): Promise<TransactionResult> {
  try {
    logger.info("Creating pool", { tokenA, tokenB, wallet: wallet.publicKey.toBase58() });

    const exists = await checkIfPoolExists(tokenA, tokenB);
    if (exists) {
      const error = "Pool already exists";
      logger.warn(error, { tokenA, tokenB });
      return { signature: "", status: "error", error };
    }

    const poolKeys = findAssociatedPoolKeys(tokenA, tokenB);
    const tokenAMint = new PublicKey(tokenA);
    const tokenBMint = new PublicKey(tokenB);

    const transaction = new Transaction();

    const rentExemption = await connection.getMinimumBalanceForRentExemption(POOL_ACCOUNT_SPACE);

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: poolKeys.id,
        lamports: rentExemption,
        space: POOL_ACCOUNT_SPACE,
        programId: RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4
      })
    );

    const createPoolData = Buffer.alloc(1 + 8 + 8);
    createPoolData.writeUInt8(0, 0);
    bnToBuffer(FEE_NUMERATOR, 8).copy(createPoolData, 1);
    bnToBuffer(FEE_DENOMINATOR, 8).copy(createPoolData, 9);

    transaction.add({
      keys: [
        { pubkey: poolKeys.id, isSigner: false, isWritable: true },
        { pubkey: poolKeys.authority, isSigner: false, isWritable: false },
        { pubkey: poolKeys.aVault, isSigner: false, isWritable: true },
        { pubkey: poolKeys.bVault, isSigner: false, isWritable: true },
        { pubkey: poolKeys.lpMint, isSigner: false, isWritable: true },
        { pubkey: tokenAMint, isSigner: false, isWritable: false },
        { pubkey: tokenBMint, isSigner: false, isWritable: false },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
      ],
      programId: RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4,
      data: createPoolData
    });

    const signature = await sendAndConfirmTransactionWithRetry(transaction, wallet);

    logger.info("Pool created successfully", {
      poolId: poolKeys.id.toBase58(),
      signature,
      tokenA,
      tokenB
    });

    return { signature, status: "success", poolId: poolKeys.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to create pool", {
      tokenA,
      tokenB,
      wallet: wallet.publicKey.toBase58(),
      error: errorMessage
    });
    return { signature: "", status: "error", error: `Failed to create pool: ${errorMessage}` };
  }
}


export async function addLiquidity(
  tokenA: string,
  tokenB: string,
  amountA: number,
  amountB: number,
  wallet: Wallet,
  slippage: number = DEFAULT_SLIPPAGE
): Promise<TransactionResult> {
  try {
    logger.info("Adding liquidity", {
      tokenA,
      tokenB,
      amountA,
      amountB,
      wallet: wallet.publicKey.toBase58(),
      slippage
    });

    const poolInfoResult = await getPoolInfo(tokenA, tokenB);
    if (!poolInfoResult.success) {
      return { signature: "", status: "error", error: "Pool does not exist" };
    }

    const poolInfo = poolInfoResult.data;
    const tokenAMint = new PublicKey(tokenA);
    const tokenBMint = new PublicKey(tokenB);

    // Validate user balances
    const userTokenAAccount = getAssociatedTokenAddressSync(tokenAMint, wallet.publicKey);
    const userTokenBAccount = getAssociatedTokenAddressSync(tokenBMint, wallet.publicKey);

    const [userTokenABalance, userTokenBBalance] = await Promise.all([
      connection.getTokenAccountBalance(userTokenAAccount),
      connection.getTokenAccountBalance(userTokenBAccount)
    ]);

    if ((userTokenABalance.value.uiAmount || 0) < amountA) {
      const error = `Insufficient token A balance. Required: ${amountA}, Available: ${userTokenABalance.value.uiAmount || 0}`;
      logger.warn(error, { tokenA, amountA, available: userTokenABalance.value.uiAmount });
      return { signature: "", status: "error", error };
    }

    if ((userTokenBBalance.value.uiAmount || 0) < amountB) {
      const error = `Insufficient token B balance. Required: ${amountB}, Available: ${userTokenBBalance.value.uiAmount || 0}`;
      logger.warn(error, { tokenB, amountB, available: userTokenBBalance.value.uiAmount });
      return { signature: "", status: "error", error };
    }

    // Slippage validation
    const inputRatio = amountA / amountB;
    const priceImpact = Math.abs(poolInfo.ratio - inputRatio) / poolInfo.ratio;

    if (priceImpact > slippage) {
      const error = `Price impact too high: ${(priceImpact * 100).toFixed(2)}% > ${(slippage * 100).toFixed(2)}%`;
      logger.warn(error, { inputRatio, poolRatio: poolInfo.ratio, priceImpact });
      return { signature: "", status: "error", error };
    }

    const userLpAccount = getAssociatedTokenAddressSync(poolInfo.lpMint, wallet.publicKey);

    const transaction = new Transaction();

    const amountABN = numberToBN(amountA);
    const amountBBN = numberToBN(amountB);

    const addLiquidityData = Buffer.alloc(1 + 8 + 8 + 8);
    addLiquidityData.writeUInt8(3, 0);
    bnToBuffer(amountABN, 8).copy(addLiquidityData, 1);
    bnToBuffer(amountBBN, 8).copy(addLiquidityData, 9);
    bnToBuffer(new BN(0), 8).copy(addLiquidityData, 17);

    transaction.add({
      keys: [
        { pubkey: poolInfo.poolId, isSigner: false, isWritable: true },
        { pubkey: poolInfo.aVault, isSigner: false, isWritable: true },
        { pubkey: poolInfo.bVault, isSigner: false, isWritable: true },
        { pubkey: poolInfo.lpMint, isSigner: false, isWritable: true },
        { pubkey: userTokenAAccount, isSigner: false, isWritable: true },
        { pubkey: userTokenBAccount, isSigner: false, isWritable: true },
        { pubkey: userLpAccount, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      programId: RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4,
      data: addLiquidityData
    });

    const signature = await sendAndConfirmTransactionWithRetry(transaction, wallet);

    logger.info("Liquidity added successfully", {
      poolId: poolInfo.poolId.toBase58(),
      signature,
      amountA,
      amountB,
      priceImpact
    });

    return { signature, status: "success", poolId: poolInfo.poolId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to add liquidity", {
      tokenA,
      tokenB,
      amountA,
      amountB,
      wallet: wallet.publicKey.toBase58(),
      error: errorMessage
    });
    return { signature: "", status: "error", error: `Failed to add liquidity: ${errorMessage}` };
  }
}

export async function removeLiquidity(
  lpToken: string,
  shares: number,
  wallet: Wallet
): Promise<TransactionResult> {
  try {
    logger.info("Removing liquidity", {
      lpToken,
      shares,
      wallet: wallet.publicKey.toBase58()
    });

    validateTokenAddress(lpToken, "lpToken");

    const lpMint = new PublicKey(lpToken);
    const userLpAccount = getAssociatedTokenAddressSync(lpMint, wallet.publicKey);

    // Validate LP token balance
    const lpBalance = await connection.getTokenAccountBalance(userLpAccount);
    if ((lpBalance.value.uiAmount || 0) < shares) {
      const error = `Insufficient LP token balance. Required: ${shares}, Available: ${lpBalance.value.uiAmount || 0}`;
      logger.warn(error, { lpToken, shares, available: lpBalance.value.uiAmount });
      return { signature: "", status: "error", error };
    }

    // Find associated pool
    const pools = await connection.getProgramAccounts(RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4, {
      filters: [
        {
          dataSize: POOL_ACCOUNT_SPACE
        },
        {
          memcmp: {
            offset: 400,
            bytes: lpMint.toBase58()
          }
        }
      ]
    });

    if (pools.length === 0) {
      const error = "Pool not found for LP token";
      logger.warn(error, { lpToken });
      return { signature: "", status: "error", error };
    }

    const poolId = pools[0].pubkey;
    const poolData = pools[0].account.data;

    const aVault = new PublicKey(poolData.slice(64, 96));
    const bVault = new PublicKey(poolData.slice(96, 128));
    const tokenAMint = new PublicKey(poolData.slice(128, 160));
    const tokenBMint = new PublicKey(poolData.slice(160, 192));

    const userTokenAAccount = getAssociatedTokenAddressSync(tokenAMint, wallet.publicKey);
    const userTokenBAccount = getAssociatedTokenAddressSync(tokenBMint, wallet.publicKey);

    const transaction = new Transaction();

    const sharesBN = numberToBN(shares);

    const removeLiquidityData = Buffer.alloc(1 + 8);
    removeLiquidityData.writeUInt8(4, 0);
    bnToBuffer(sharesBN, 8).copy(removeLiquidityData, 1);

    transaction.add({
      keys: [
        { pubkey: poolId, isSigner: false, isWritable: true },
        { pubkey: aVault, isSigner: false, isWritable: true },
        { pubkey: bVault, isSigner: false, isWritable: true },
        { pubkey: lpMint, isSigner: false, isWritable: true },
        { pubkey: userTokenAAccount, isSigner: false, isWritable: true },
        { pubkey: userTokenBAccount, isSigner: false, isWritable: true },
        { pubkey: userLpAccount, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      programId: RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4,
      data: removeLiquidityData
    });

    const signature = await sendAndConfirmTransactionWithRetry(transaction, wallet);

    logger.info("Liquidity removed successfully", {
      poolId: poolId.toBase58(),
      lpToken,
      shares,
      signature
    });

    return { signature, status: "success", poolId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to remove liquidity", {
      lpToken,
      shares,
      wallet: wallet.publicKey.toBase58(),
      error: errorMessage
    });
    return { signature: "", status: "error", error: `Failed to remove liquidity: ${errorMessage}` };
  }
}


export async function getAllPools(): Promise<PublicKey[]> {
  try {
    logger.debug("Fetching all pools");

    const accounts = await connection.getProgramAccounts(RAYDIUM_LIQUIDITY_POOL_PROGRAM_V4, {
      filters: [{ dataSize: POOL_ACCOUNT_SPACE }]
    });

    const pools = accounts.map(account => account.pubkey);
    logger.info("Successfully fetched pools", { count: pools.length });

    return pools;
  } catch (error) {
    logger.error("Error fetching pools", {
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}
