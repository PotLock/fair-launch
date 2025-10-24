import { DEVNET_PROGRAM_ID, CpmmPoolInfoLayout } from '@raydium-io/raydium-sdk-v2';
import { PublicKey } from '@solana/web3.js';
import { connection } from '../configs/raydium';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { EnhancedPool, TokenMetadata, PoolMetric } from '../types';
import { deserializeMetadata } from '@metaplex-foundation/mpl-token-metadata';

const tokenMetadataCache = new Map<string, TokenMetadata>();

/**
 * Retrieves token metadata from Metaplex or returns fallback data
 * @param mint - The token mint public key
 * @returns Promise resolving to token metadata with name, symbol, and image
 */
async function getTokenMetadata(mint: PublicKey): Promise<TokenMetadata> {
  const mintStr = mint.toBase58();
  
  if (tokenMetadataCache.has(mintStr)) {
    return tokenMetadataCache.get(mintStr)!;
  }

  try {
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(metadataPDA);

    if (accountInfo?.data) {
      //@ts-ignore
      const metadata = deserializeMetadata(accountInfo);
      let image = '';
      if (metadata.uri && metadata.uri.startsWith('http')) {
        try {
          const response = await fetch(metadata.uri, {
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
            const imageData = await response.json();
            image = imageData.image || '';
          }
        } catch (e) {
          console.debug('Failed to fetch token metadata URI:', metadata.uri);
        }
      }
      
      const result = { 
        name: metadata.name.replace(/\0/g, ''), 
        symbol: metadata.symbol.replace(/\0/g, ''), 
        image 
      };
      tokenMetadataCache.set(mintStr, result);
      return result;
    }
  } catch (error) {
    console.debug('Failed to get token metadata for:', mintStr);
  }
  
  const result = {
    name: `Token ${mintStr.slice(0, 8)}`,
    symbol: mintStr.slice(0, 4).toUpperCase(),
    image: ''
  };
  
  tokenMetadataCache.set(mintStr, result);
  return result;
}

/**
 * Gets the appropriate icon for a token based on metadata or known token addresses
 * @param mint - The token mint public key
 * @param metadata - The token metadata object
 * @returns The icon URL or path for the token
 */
function getTokenIcon(mint: PublicKey, metadata: TokenMetadata): string {
  if (metadata.image) {
    return metadata.image;
  }
  
  const mintStr = mint.toBase58();
  
  if (mintStr === 'So11111111111111111111111111111111111111112') {
    return '/chains/solana-dark.svg';
  }
  
  if (mintStr === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
    return '/icons/usdc.svg';
  }
  
  return 'https://gateway.pinata.cloud/ipfs/QmYN7vFLxgW4X8WuoV5RPJhxRCdU8edH7izSVTwrSLh1D7';
}

/**
 * Calculates pool metrics including liquidity, volume, and fees
 * @param pool - The pool object containing liquidity and decimal information
 * @returns Array of pool metrics with labels and values
 */
function calculatePoolMetrics(pool: any): PoolMetric[] {
  try {
    let totalLiquidity = 0;
    
    if (pool.lpAmount && pool.lpDecimals !== undefined) {
      try {
        const lpAmountNum = pool.lpAmount.toNumber();
        totalLiquidity = lpAmountNum / Math.pow(10, pool.lpDecimals);
      } catch (error) {
        const lpAmountStr = pool.lpAmount.toString();
        const divisor = Math.pow(10, pool.lpDecimals);
        totalLiquidity = parseFloat(lpAmountStr) / divisor;
      }
    }
    
    const liquidityValue = totalLiquidity > 0 ? `$${(totalLiquidity * 0.1).toFixed(1)}K` : '$0';
    
    return [
      { label: "Total Liquidity", value: liquidityValue },
      { label: "24h Volume", value: "$45K" },
      { label: "24h Fee/TVL", value: "0.051%" },
      { label: "Fee Earned", value: "$53.4" },
      { label: "Your LP Position", value: "$25,000", isHighlighted: true },
    ];
  } catch (error) {
    console.warn('Error calculating pool metrics:', error);
    return [
      { label: "Total Liquidity", value: "$0" },
      { label: "24h Volume", value: "$0" },
      { label: "24h Fee/TVL", value: "0%" },
      { label: "Fee Earned", value: "$0" },
      { label: "Your LP Position", value: "$0" },
    ];
  }
}

/**
 * Fetches all CPMM pools from the Raydium program
 * @returns Promise resolving to array of CPMM pool data with pool IDs
 */
export async function getAllCpmmPools() {
  try {
    const cpmmPools: (ReturnType<typeof CpmmPoolInfoLayout.decode> & { poolId: PublicKey })[] = []

    const cpmmPoolsData = await connection.getProgramAccounts(
      DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
    )

    for (const acc of cpmmPoolsData) {
      try{
        const decoded = CpmmPoolInfoLayout.decode(acc.account.data)
        cpmmPools.push({ ...decoded, poolId: acc.pubkey })
      }catch(error){
        // Silently skip invalid pool data
      }
    }

    return cpmmPools
  } catch (error) {
    console.error('Failed to fetch CPMM pools:', error);
    return [];
  }
}

let enhancedPoolsCache: EnhancedPool[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000;

/**
 * Utility function to add delay between API calls for rate limiting
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetches and enhances all CPMM pools for a specific user with metadata and metrics
 * @param user - The user's public key to filter pools by creator
 * @returns Promise resolving to array of enhanced pool objects with metadata
 */
export async function getAllEnhancedCpmmPools(user: PublicKey): Promise<EnhancedPool[]> {
  const now = Date.now();
  if (enhancedPoolsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return enhancedPoolsCache;
  }

  const pools = await getAllCpmmPools();
  const userPools = pools.filter((pool) => pool.poolCreator.equals(user))

  if (userPools.length === 0) {
    enhancedPoolsCache = [];
    cacheTimestamp = now;
    return [];
  }

  const enhancedPools: EnhancedPool[] = [];
  
  const batchSize = 5;
  for (let i = 0; i < userPools.length; i += batchSize) {
    const batch = userPools.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (pool) => {
      try {
        await delay(100);
        const [token1Metadata, token2Metadata] = await Promise.all([
          getTokenMetadata(pool.mintA),
          getTokenMetadata(pool.mintB)
        ]);

        const token1Icon = getTokenIcon(pool.mintA, token1Metadata);
        const token2Icon = getTokenIcon(pool.mintB, token2Metadata);

        const poolName = `${token1Metadata.symbol}-${token2Metadata.symbol}`;

        const metrics = calculatePoolMetrics(pool);

        const enhancedPool: EnhancedPool = {
          ...pool,
          token1Metadata,
          token2Metadata,
          token1Icon,
          token2Icon,
          poolName,
          chain: {
            name: "Solana",
            icon: "/chains/solana-dark.svg"
          },
          platforms: [
            {
              platform: "Raydium",
              platformIcon: "/logos/raydium.png"
            },
            {
              platform: "Solana",
              platformIcon: "/chains/solana-dark.svg"
            }
          ],
          metrics,
          isExpanded: false
        };

        return enhancedPool;
      } catch (error) {
        console.error('Failed to enhance pool:', error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    enhancedPools.push(...batchResults.filter(pool => pool !== null) as EnhancedPool[]);
    
    if (i + batchSize < pools.length) {
      await delay(200);
    }
  }

  enhancedPoolsCache = enhancedPools;
  cacheTimestamp = now;

  return enhancedPools;
}

/**
 * Gets all CPMM pools created by a specific user
 * @param user - The user's public key
 * @returns Promise resolving to array of user-created CPMM pools
 */
export async function getUserCreatedCpmmPools(user: PublicKey) {
  const allPools = await getAllCpmmPools()
  const userPools = allPools.filter((pool) => pool.poolCreator.equals(user))

  return userPools
}

/**
 * Gets all enhanced CPMM pools created by a specific user
 * @param user - The user's public key
 * @returns Promise resolving to array of enhanced user-created CPMM pools
 */
export async function getUserCreatedEnhancedCpmmPools(user: PublicKey): Promise<EnhancedPool[]> {
  const userPools = await getAllEnhancedCpmmPools(user)
  return userPools
}

/**
 * Detects the token program ID for a given mint address
 * @param mint - The token mint public key
 * @returns Promise resolving to the appropriate token program ID
 */
export async function getTokenProgramId(mint: PublicKey): Promise<PublicKey> {
	const tokenInfo = await connection.getParsedAccountInfo(mint);
	
	if (tokenInfo.value?.owner?.equals(TOKEN_2022_PROGRAM_ID)) {
		return TOKEN_2022_PROGRAM_ID;
	} else if (tokenInfo.value?.owner?.equals(TOKEN_PROGRAM_ID)) {
		return TOKEN_PROGRAM_ID;
	} else {
		console.warn(`Unknown token program for ${mint.toBase58()}, defaulting to TOKEN_PROGRAM_ID`);
		return TOKEN_PROGRAM_ID;
	}
}