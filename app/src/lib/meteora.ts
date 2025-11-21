import { Connection, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";

/**
 * Calculate swap quote for DBC pool using Meteora SDK
 * @param connection - Solana connection
 * @param poolAddress - DBC pool public key
 * @param inputAmount - Amount to swap (in human units, e.g., 1.5 SOL or 1000 tokens)
 * @param swapBaseForQuote - true if selling tokens for SOL, false if buying tokens with SOL
 * @param tokenDecimals - Decimals of the base token
 * @param slippageBps - Slippage in basis points (e.g., 50 = 0.5%)
 * @returns Estimated output amount in human units
 */
export async function calculateDbcSwapQuote(
  connection: Connection,
  poolAddress: string,
  inputAmount: number,
  swapBaseForQuote: boolean,
  tokenDecimals: number = 9,
  slippageBps: number = 50
): Promise<number> {
  try {
    const client = new DynamicBondingCurveClient(connection, 'confirmed');
    const poolPubkey = new PublicKey(poolAddress);

    // Fetch pool state
    const virtualPoolState = await client.state.getPool(poolPubkey);
    if (!virtualPoolState) {
      throw new Error(`Pool not found: ${poolAddress}`);
    }

    // Fetch pool config
    const poolConfigState = await client.state.getPoolConfig(virtualPoolState.config);
    if (!poolConfigState) {
      throw new Error("Pool config not found");
    }

    const inputDecimals = swapBaseForQuote ? tokenDecimals : 9; 
    const amountIn = new BN(Math.floor(inputAmount * Math.pow(10, inputDecimals)));

    const quote = await client.pool.swapQuote({
      virtualPool: virtualPoolState,
      config: poolConfigState,
      swapBaseForQuote,
      amountIn,
      slippageBps,
      hasReferral: false,
      currentPoint: new BN(0),
    });

    let outputAmountBN: BN;
    const quoteAny = quote as { outputAmount?: BN; minimumAmountOut?: BN };
    if (quoteAny.outputAmount) {
      outputAmountBN = new BN(quoteAny.outputAmount.toString());
    } else if (quoteAny.minimumAmountOut) {
      outputAmountBN = new BN(quoteAny.minimumAmountOut.toString());
    } else {
      throw new Error("Quote outputAmount is undefined");
    }

    const outputDecimals = swapBaseForQuote ? 9 : tokenDecimals; 
    const outputAmount = outputAmountBN.toNumber() / Math.pow(10, outputDecimals);

    return outputAmount;
  } catch (error) {
    console.error("Error calculating DBC swap quote:", error);
    throw error;
  }
}

/**
 * Simple approximation for swap quote when SDK call fails
 * Uses constant product formula with fee adjustment
 */
export function approximateSwapQuote(
  baseReserve: number,
  quoteReserve: number,
  inputAmount: number,
  swapBaseForQuote: boolean,
  feePercent: number = 0.003
): number {
  const effectiveInput = inputAmount * (1 - feePercent);
  const k = baseReserve * quoteReserve;

  if (swapBaseForQuote) {
    const newBaseReserve = baseReserve + effectiveInput;
    const newQuoteReserve = k / newBaseReserve;
    return quoteReserve - newQuoteReserve;
  } else {
    const newQuoteReserve = quoteReserve + effectiveInput;
    const newBaseReserve = k / newQuoteReserve;
    return baseReserve - newBaseReserve;
  }
}
