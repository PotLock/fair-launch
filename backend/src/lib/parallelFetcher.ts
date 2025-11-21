import { TokenService } from '../services/tokenService';
import { HalfbakService } from '../services/halfbakService';
import { decimalToString } from './numberUtils';

/**
 * Token metrics fetched from on-chain data
 */
export interface TokenMetricsData {
  price: string;
  holders: number;
  marketCap: string;
  supply: string;
  poolState?: any;
  poolConfig?: any;
}

/**
 * Fetches token metrics in parallel from multiple sources.
 * Uses Promise.allSettled to ensure all metrics are returned even if some calls fail.
 * Never throws - always returns valid metrics with safe defaults.
 */
export async function fetchTokenMetrics(
  mintAddress: string,
  totalSupply: string,
  decimals: number,
  tokenService: TokenService,
  halfbakService: HalfbakService
): Promise<TokenMetricsData> {
  // Default metrics if all calls fail
  const defaultMetrics: TokenMetricsData = {
    price: '0',
    holders: 0,
    marketCap: '0',
    supply: totalSupply || '0',
  };

  try {
    // Fetch all data in parallel using Promise.allSettled
    // This ensures we get results even if some calls fail
    const [holdersResult, poolStateResult, poolConfigResult] = await Promise.allSettled([
      tokenService.getHoldersByMintAddress(mintAddress),
      halfbakService.getPoolStateByMintAddress(mintAddress),
      halfbakService.getPoolConfigByMintAddress(mintAddress),
    ]);

    // Extract holders count
    let holders = 0;
    if (holdersResult.status === 'fulfilled') {
      holders = Array.isArray(holdersResult.value) ? holdersResult.value.length : 0;
    }

    // Extract pool state
    let poolState: any = null;
    if (poolStateResult.status === 'fulfilled') {
      poolState = poolStateResult.value;
    }

    // Extract pool config
    let poolConfig: any = null;
    if (poolConfigResult.status === 'fulfilled') {
      poolConfig = poolConfigResult.value;
    }

    // Calculate metrics from pool state
    if (poolState && poolState.account) {
      const baseReserve = poolState.account.baseReserve;
      const quoteReserve = poolState.account.quoteReserve;

      if (baseReserve && quoteReserve) {
        try {
          // Import Decimal
          const Decimal = (await import('decimal.js')).default;
          
          const baseReserveDecimal = new Decimal(baseReserve.toString());
          const quoteReserveDecimal = new Decimal(quoteReserve.toString());
          
          // Avoid division by zero
          if (baseReserveDecimal.isZero()) {
            return {
              ...defaultMetrics,
              holders,
              poolState,
              poolConfig,
            };
          }
          
          // Calculate price: quoteReserve / baseReserve
          const priceDecimal = quoteReserveDecimal.div(baseReserveDecimal);
          
          // Adjust for decimals (assuming quote is SOL with 9 decimals)
          const decimalAdjustment = new Decimal(10).pow(decimals - 9);
          const adjustedPrice = priceDecimal.mul(decimalAdjustment);
          
          // Supply is base reserve converted from lamports
          const supplyDecimal = baseReserveDecimal.div(new Decimal(10).pow(decimals));
          const supply = decimalToString(supplyDecimal);
          
          // Market cap: price * total supply
          const totalSupplyDecimal = new Decimal(totalSupply || '0');
          const marketCapDecimal = adjustedPrice.mul(totalSupplyDecimal);
          const marketCap = decimalToString(marketCapDecimal);
          
          return {
            price: decimalToString(adjustedPrice),
            holders,
            marketCap,
            supply,
            poolState,
            poolConfig,
          };
        } catch (calcError) {
          console.error(`Error calculating metrics for ${mintAddress}:`, calcError);
          // Return defaults if calculation fails
        }
      }
    }

    // If pool state is missing or invalid, return defaults
    return {
      ...defaultMetrics,
      holders,
      poolState: poolState || undefined,
      poolConfig: poolConfig || undefined,
    };
  } catch (error) {
    console.error(`Error fetching metrics for token ${mintAddress}:`, error);
    // Always return valid metrics, never throw
    return defaultMetrics;
  }
}

