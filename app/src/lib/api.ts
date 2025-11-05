import { Token, CreateToken, SwapParams, SwapResponse, Transaction, TransactionCreateRequest, TransactionStatus, TransactionAction, TransactionChain } from '@/types/api';
import { PoolState, PoolConfig } from '@/types/pool';

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createToken(tokenData: CreateToken) {
  try {
    tokenData.launchpad = 'potlaunch';
    // ensure tags are lowercased and valid
    if (Array.isArray((tokenData as any).tags)) {
      (tokenData as any).tags = (tokenData as any).tags.map((t: string) => t.toLowerCase());
    }
    const response = await fetch(`${API_URL}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating token:', error);
    throw new Error('Failed to create token');
  }
}

export async function requestDBCConfig(params: {
  metadata: {
    name: string;
    symbol: string;
    description: string;
    imageUri?: string;
    bannerUri?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
  };
  signer: string;
}) {
  try {
    const response = await fetch(`${API_URL}/api/halfbak/dbc-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error requesting DBC config:', error);
    throw error;
  }
}

export async function requestDeployToken(params: {
  metadata: {
    name: string;
    symbol: string;
    description: string;
    imageUri?: string;
    bannerUri?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
  };
  signer: string;
  dbcConfigKeypair: any;
}) {
  try {
    const response = await fetch(`${API_URL}/api/halfbak/deploy-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error requesting deploy token:', error);
    throw error;
  }
}

export async function Swap(swapParams: SwapParams): Promise<SwapResponse> {
  try {
    const response = await fetch(`${API_URL}/api/halfbak/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapParams),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error executing swap:', error);
    throw new Error('Failed to execute swap transaction');
  }
}

export async function getUserTokens(address: string): Promise<Token[]> {
  try {
    const response = await fetch(`${API_URL}/api/tokens/address/${address}`, {
      next: { revalidate: 10 }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error getting user tokens:', error);
    throw new Error('Failed to get user tokens');
  }
}

export async function getTokenByMint(mint: string): Promise<Token | null> {
  try {
    const response = await fetch(`${API_URL}/api/tokens/mint/${mint}`, {
      next: { revalidate: 10 }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting token by mint:', error);
    throw new Error('Failed to get token by mint');
  }
}

export async function getTokenHolders(mint: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/tokens/holders/${mint}`, {
      next: { revalidate: 10 }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error getting token holders:', error);
    throw new Error('Failed to get token holders');
  }
}

export async function getPoolStateByMint(mint: string): Promise<PoolState> {
  try {
    const response = await fetch(`${API_URL}/api/halfbak/pool/state/${mint}`, {
      next: { revalidate: 10 }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting pool by mint:', error);
    throw new Error('Failed to get pool by mint');
  }
}

export async function fetchPoolDataForRSC(mint: string) {
  try {
    const poolState = await getPoolStateByMint(mint);
    
    if (!poolState) {
      return null;
    }
    
    return {
      poolState,
      formattedData: {
        id: poolState.publicKey,
        baseMint: poolState.account.baseMint,
        quoteReserve: poolState.account.quoteReserve,
        baseReserve: poolState.account.baseReserve,
        sqrtPrice: poolState.account.sqrtPrice,
      }
    };
  } catch (error) {
    console.error('Error fetching pool data for RSC:', error);
    return null;
  }
}

export async function getPoolConfigByMint(mint: string): Promise<PoolConfig> {
  try {
    const response = await fetch(`${API_URL}/api/halfbak/pool/config/${mint}`, {
      next: { revalidate: 60 }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting pool by mint:', error);
    throw new Error('Failed to get pool by mint');
  }
}

export async function getPoolCurveProgressByMint(mint: string): Promise<number> {
  try {
    const response = await fetch(`${API_URL}/api/halfbak/pool/curve-progress/${mint}`, {
      next: { revalidate: 60 }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting pool by mint:', error);
    throw new Error('Failed to get pool by mint');
  }
}

export async function getTokens(options?: {
  tag?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const params = new URLSearchParams({ launchpad: 'potlaunch' });
    
    if (options?.tag) {
      params.append('tag', options.tag);
    }
    if (options?.startDate) {
      params.append('startDate', options.startDate);
    }
    if (options?.endDate) {
      params.append('endDate', options.endDate);
    }
    
    const response = await fetch(`${API_URL}/api/tokens?${params}`, {
      next: { revalidate: 10 }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Failed to get tokens');
  }
}

export async function getPopularTokens(limit: number = 20, options?: {
  tag?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Token[]> {
  try {
    const params = new URLSearchParams({ 
      limit: String(limit),
      launchpad: 'potlaunch' 
    });
    
    if (options?.tag) {
      params.append('tag', options.tag);
    }
    if (options?.startDate) {
      params.append('startDate', options.startDate);
    }
    if (options?.endDate) {
      params.append('endDate', options.endDate);
    }
    
    const response = await fetch(`${API_URL}/api/tokens/popular?${params}`, {
      next: { revalidate: 1 }
    });
    
    if (!response.ok) {
      const params2 = new URLSearchParams({ launchpad: 'potlaunch' });
      if (options?.tag) {
        params2.append('tag', options.tag);
      }
      if (options?.startDate) {
        params2.append('startDate', options.startDate);
      }
      if (options?.endDate) {
        params2.append('endDate', options.endDate);
      }
      
      const fallbackResponse = await fetch(`${API_URL}/api/tokens?${params2}`, {
        next: { revalidate: 1 }
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
      }
      
      const fallbackResult = await fallbackResponse.json();
      const tokens = fallbackResult.data || fallbackResult.tokens || [];
      return tokens.slice(0, limit);
    }
    
    const result = await response.json();
    return result.data || result.tokens || [];
  } catch (error) {
    console.error('Error getting popular tokens:', error);
    try {
      const params2 = new URLSearchParams({ launchpad: 'potlaunch' });
      if (options?.tag) {
        params2.append('tag', options.tag);
      }
      if (options?.startDate) {
        params2.append('startDate', options.startDate);
      }
      if (options?.endDate) {
        params2.append('endDate', options.endDate);
      }
      
      const fallbackResponse = await fetch(`${API_URL}/api/tokens?${params2}`, {
        next: { revalidate: 1 }
      });
      
      if (!fallbackResponse.ok) {
        return [];
      }
      
      const fallbackResult = await fallbackResponse.json();
      const tokens = fallbackResult.data || fallbackResult.tokens || [];
      return tokens.slice(0, limit);
    } catch (fallbackError) {
      console.error('Error getting fallback tokens:', fallbackError);
      return [];
    }
  }
}

export async function searchTokens(query: string, options?: {
  owner?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const params = new URLSearchParams({ q: query });
    params.append('launchpad', 'potlaunch');
    
    if (options?.owner) {
      params.append('owner', options.owner);
    }
    if (options?.tag) {
      params.append('tag', options.tag);
    }
    if (options?.startDate) {
      params.append('startDate', options.startDate);
    }
    if (options?.endDate) {
      params.append('endDate', options.endDate);
    }
    
    const response = await fetch(`${API_URL}/api/tokens/search?${params}`, {
      next: { revalidate: 10 }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error searching tokens:', error);
    throw new Error('Failed to search tokens');
  }
}

export async function uploadImage(imageFile: File, fileName: string) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('fileName', fileName);

    const response = await fetch(`${API_URL}/api/ipfs/upload-image`, {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function uploadMetadata(metadata: {
  name: string;
  symbol: string;
  imageUri: string;
  bannerUri?: string;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}) {
  try {
    const response = await fetch(`${API_URL}/api/ipfs/upload-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading metadata:', error);
    throw new Error('Failed to upload metadata');
  }
}

// Transactions API
export async function createTransaction(payload: TransactionCreateRequest): Promise<Transaction> {
  try {
    const response = await fetch(`${API_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.transaction || result.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to create transaction');
  }
}

export async function listTransactions(options?: {
  userAddress?: string;
  action?: TransactionAction;
  baseToken?: string;
  quoteToken?: string;
  status?: TransactionStatus;
  chain?: TransactionChain;
}): Promise<Transaction[]> {
  try {
    const params = new URLSearchParams();
    if (options?.userAddress) params.append('userAddress', options.userAddress);
    if (options?.action) params.append('action', options.action);
    if (options?.baseToken) params.append('baseToken', options.baseToken);
    if (options?.quoteToken) params.append('quoteToken', options.quoteToken);
    if (options?.status) params.append('status', options.status);
    if (options?.chain) params.append('chain', options.chain);

    const url = params.toString()
      ? `${API_URL}/api/transactions?${params.toString()}`
      : `${API_URL}/api/transactions`;

    const response = await fetch(url, { next: { revalidate: 10 } });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.transactions || result.data || [];
  } catch (error) {
    console.error('Error listing transactions:', error);
    throw new Error('Failed to list transactions');
  }
}

export async function getTransactionsByUser(address: string): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_URL}/api/transactions/user/${address}`, {
      next: { revalidate: 10 }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.transactions || result.data || [];
  } catch (error) {
    console.error('Error getting transactions by user:', error);
    throw new Error('Failed to get transactions by user');
  }
}

export async function getTransactionsByToken(address: string): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_URL}/api/transactions/token/${address}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.transactions || result.data || [];
  } catch (error) {
    console.error('Error getting transactions by token:', error);
    throw new Error('Failed to get transactions by token');
  }
}

export async function updateTransactionStatus(id: string ,status: TransactionStatus, hash?: string): Promise<Transaction> {
  try {
    const response = await fetch(`${API_URL}/api/transactions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash: hash ,status }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.transaction || result.data;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw new Error('Failed to update transaction status');
  }
}

// Return tokens a user has purchased by inspecting BUY transactions
export async function getPurchasedTokens(address: string): Promise<Token[]> {
  try {
    const transactions = await getTransactionsByUser(address);
    const buyTxs = transactions.filter((t) => t.action === TransactionAction.BUY);
    const mints = Array.from(
      new Set(
        buyTxs
          .map((t) => t.quoteToken)
          .filter((m): m is string => typeof m === 'string' && m.length > 0)
      )
    );
    const tokens = await Promise.all(mints.map((mint) => getTokenByMint(mint)));
    return tokens.filter((t): t is Token => Boolean(t));
  } catch (error) {
    console.error('Error getting purchased tokens:', error);
    return [];
  }
}

export async function getAveragePriceFromTransactions(
  mint: string,
  hoursAgo: number = 24
): Promise<number | null> {
  try {
    const transactions = await getTransactionsByToken(mint);

    if (!transactions || transactions.length === 0) {
      return null;
    }

    const now = new Date();
    const timeThreshold = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    const recentTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate >= timeThreshold;
    });

    if (recentTransactions.length === 0) {
      return null;
    }

    const totalPrice = recentTransactions.reduce((sum, tx) => {
      return sum + Number(tx.pricePerToken);
    }, 0);

    return totalPrice / recentTransactions.length;
  } catch (error) {
    console.error('Error calculating average price from transactions:', error);
    return null;
  }
}

export async function getOldestPriceFromTransactions(
  mint: string,
  hoursAgo: number = 24
): Promise<number | null> {
  try {
    const transactions = await getTransactionsByToken(mint);

    if (!transactions || transactions.length === 0) {
      return null;
    }

    const now = new Date();
    const timeThreshold = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    const oldTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate >= timeThreshold;
    });

    if (oldTransactions.length === 0) {
      return null;
    }

    oldTransactions.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return Number(oldTransactions[0].pricePerToken);
  } catch (error) {
    console.error('Error getting oldest price from transactions:', error);
    return null;
  }
}
