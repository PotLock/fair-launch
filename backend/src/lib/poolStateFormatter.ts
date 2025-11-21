import Decimal from 'decimal.js';
import { decimalToString, stringToDecimal } from './numberUtils';

/**
 * Token metrics calculated from pool state
 */
export interface TokenMetrics {
  price: string;
  marketCap: string;
  supply: string;
}

/**
 * Formats pool state data into token metrics.
 * Returns safe defaults if pool state is missing or invalid.
 */
export function formatPoolStateToMetrics(
  poolState: any,
  poolConfig: any,
  totalSupply: string,
  decimals: number
): TokenMetrics {
  try {
    if (!poolState || !poolState.account) {
      return {
        price: '0',
        marketCap: '0',
        supply: totalSupply || '0',
      };
    }

    const baseReserve = poolState.account.baseReserve;
    const quoteReserve = poolState.account.quoteReserve;

    if (!baseReserve || !quoteReserve) {
      return {
        price: '0',
        marketCap: '0',
        supply: totalSupply || '0',
      };
    }

    // Convert reserves to Decimal for safe calculations
    const baseReserveDecimal = new Decimal(baseReserve.toString());
    const quoteReserveDecimal = new Decimal(quoteReserve.toString());

    // Avoid division by zero
    if (baseReserveDecimal.isZero()) {
      return {
        price: '0',
        marketCap: '0',
        supply: totalSupply || '0',
      };
    }

    // Calculate price: quoteReserve / baseReserve
    // Price represents how much quote token (SOL) per base token
    const priceDecimal = quoteReserveDecimal.div(baseReserveDecimal);
    
    // Adjust for decimals
    // If token has 6 decimals and SOL has 9 decimals, we need to adjust
    const decimalAdjustment = new Decimal(10).pow(decimals - 9); // Assuming quote is SOL (9 decimals)
    const adjustedPrice = priceDecimal.mul(decimalAdjustment);

    // Supply is the base reserve (circulating supply in the pool)
    // Convert from lamports to token units
    const supplyDecimal = baseReserveDecimal.div(new Decimal(10).pow(decimals));
    const supply = decimalToString(supplyDecimal);

    // Calculate market cap: price * total supply
    const totalSupplyDecimal = stringToDecimal(totalSupply);
    const marketCapDecimal = adjustedPrice.mul(totalSupplyDecimal);
    const marketCap = decimalToString(marketCapDecimal);

    return {
      price: decimalToString(adjustedPrice),
      marketCap,
      supply,
    };
  } catch (error) {
    console.error('Error formatting pool state to metrics:', error);
    // Return safe defaults on any error
    return {
      price: '0',
      marketCap: '0',
      supply: totalSupply || '0',
    };
  }
}

