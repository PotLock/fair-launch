import type { TokenWithRelations, CleanTokenResponse } from '../types';
import type { TokenMetricsData } from './parallelFetcher';
import { formatPoolStateToMetrics } from './poolStateFormatter';
import { decimalToString } from './numberUtils';

/**
 * Formats a token response with metrics included.
 * Guarantees all required fields are present with safe defaults.
 */
export function formatTokenResponseWithMetrics(
  token: TokenWithRelations,
  metrics: TokenMetricsData,
  dbcConfig?: any
): CleanTokenResponse {
  // Ensure metadata always has bannerUri and tokenUri
  const metadata = token.metadata ? {
    ...token.metadata,
    bannerUri: token.metadata.bannerUri || '',
    tokenUri: token.metadata.tokenUri || '',
  } : {
    bannerUri: '',
    tokenUri: '',
    website: null,
    twitter: null,
    telegram: null,
    metadataUri: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Remove internal IDs from dbcConfig if present
  const cleanedDbcConfig = dbcConfig ? removeInternalIds(dbcConfig) : undefined;

  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    description: token.description,
    totalSupply: decimalToString(token.totalSupply),
    decimals: token.decimals,
    mintAddress: token.mintAddress,
    owner: token.owner,
    launchpad: token.launchpad,
    tags: token.tags || [],
    active: token.active,
    createdAt: token.createdAt,
    updatedAt: token.updatedAt,
    // Required metrics - always present
    price: metrics.price || '0',
    holders: metrics.holders || 0,
    marketCap: metrics.marketCap || '0',
    supply: metrics.supply || decimalToString(token.totalSupply),
    metadata: metadata as any,
    dbcConfig: cleanedDbcConfig,
  };
}

/**
 * Helper function to remove internal IDs from nested objects
 */
function removeInternalIds(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeInternalIds(item));
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip internal database IDs and relation IDs
    if (key === 'id' || 
        key === 'dbcConfigId' || 
        key === 'baseFeeParamsId' || 
        key === 'tokenId') {
      continue;
    }
    
    cleaned[key] = removeInternalIds(value);
  }
  return cleaned;
}

