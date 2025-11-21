import useSWR from 'swr';

interface PriceData {
  usd: number;
  usd_24h_change?: number;
}

interface CoinGeckoPriceResponse {
  solana?: PriceData;
  near?: PriceData;
  ethereum?: PriceData;
}

interface UseCryptoPricesResult {
  prices: {
    solana: number | null;
    near: number | null;
    ethereum: number | null;
  };
  isLoading: boolean;
  error: Error | null;
  getExchangeRate: (from: string, to: string) => number | null;
  refetch: () => Promise<CoinGeckoPriceResponse | undefined>;
}

// Global cache to share data across all hook instances
interface CacheEntry {
  data: CoinGeckoPriceResponse | null;
  timestamp: number;
  error: Error | null;
}

const globalCache: CacheEntry = {
  data: null,
  timestamp: 0,
  error: null,
};

// Minimum time between API calls (60 seconds to stay well within rate limits)
const MIN_FETCH_INTERVAL = 60000;

// Track if a fetch is currently in progress to prevent duplicate requests
let fetchPromise: Promise<CoinGeckoPriceResponse> | null = null;

const fetcher = async (url: string): Promise<CoinGeckoPriceResponse> => {
  const now = Date.now();

  // Return cached data if it's still fresh
  if (globalCache.data && (now - globalCache.timestamp) < MIN_FETCH_INTERVAL) {
    return globalCache.data;
  }

  // If a fetch is already in progress, wait for it
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start new fetch
  fetchPromise = (async () => {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          console.warn('CoinGecko API rate limited, using cached data');
          if (globalCache.data) {
            return globalCache.data;
          }
          throw new Error('Rate limited and no cached data available');
        }
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }

      const data = await response.json();

      // Update global cache
      globalCache.data = data;
      globalCache.timestamp = now;
      globalCache.error = null;

      return data;
    } catch (error) {
      globalCache.error = error as Error;

      // Return stale cache if available
      if (globalCache.data) {
        console.warn('Fetch failed, using stale cached data');
        return globalCache.data;
      }

      throw error;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
};

export const useCryptoPrices = (): UseCryptoPricesResult => {
  const { data, error, isLoading, mutate } = useSWR<CoinGeckoPriceResponse>(
    'https://api.coingecko.com/api/v3/simple/price?ids=solana,near,ethereum&vs_currencies=usd&include_24hr_change=true',
    fetcher,
    {
      refreshInterval: 60000, 
      revalidateOnFocus: false, 
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      fallbackData: globalCache.data || undefined,
    }
  );

  const prices = {
    solana: data?.solana?.usd ?? null,
    near: data?.near?.usd ?? null,
    ethereum: data?.ethereum?.usd ?? null,
  };

  // Calculate exchange rate between two cryptocurrencies
  const getExchangeRate = (from: string, to: string): number | null => {
    const fromPrice = prices[from.toLowerCase() as keyof typeof prices];
    const toPrice = prices[to.toLowerCase() as keyof typeof prices];

    if (fromPrice === null || toPrice === null || toPrice === 0) {
      return null;
    }

    return fromPrice / toPrice;
  };

  // Refetch function that bypasses cache
  const refetch = async () => {
    // Clear the cache timestamp to force a fresh fetch
    globalCache.timestamp = 0;
    return mutate();
  };

  return {
    prices,
    isLoading,
    error: error ?? null,
    getExchangeRate,
    refetch,
  };
};
