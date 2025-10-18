import { Token, Pool } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createToken(tokenData: Token) {
  try {
    const response = await fetch(`${API_URL}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData),
      // Don't cache POST requests
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

export async function getTokenByAddress(address: string): Promise<Token[]> {
  try {
    const response = await fetch(`${API_URL}/api/tokens/address/${address}`, {
      // Cache for 5 minutes
      next: { revalidate: 300 }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error getting token by address:', error);
    throw new Error('Failed to get token by address');
  }
}

export async function getTokenByMint(mint: string): Promise<Token | null> {
  try {
    const response = await fetch(`${API_URL}/api/tokens/mint/${mint}`, {
      // Cache for 30 seconds
      next: { revalidate: 30 }
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
      // Cache for 5 minutes
      next: { revalidate: 300 }
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

export async function getPoolByMint(mint: string): Promise<Pool> {
  try {
    const response = await fetch(`${API_URL}/api/halfbak/pool/state/${mint}`, {
      // Cache for 5 minutes
      next: { revalidate: 300 }
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

export async function getTokens() {
  try {
    const response = await fetch(`${API_URL}/api/tokens`, {
      // Cache for 1 minute for frequently changing data
      next: { revalidate: 60 }
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

export async function getPopularTokens(limit: number = 20): Promise<Token[]> {
  try {
    const response = await fetch(`${API_URL}/api/tokens/popular?limit=${limit}`, {
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      // Fallback to regular tokens if popular endpoint doesn't exist
      const fallbackResponse = await fetch(`${API_URL}/api/tokens`, {
        next: { revalidate: 60 }
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
      const fallbackResponse = await fetch(`${API_URL}/api/tokens`, {
        next: { revalidate: 300 }
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

export async function searchTokens(query: string, owner?: string) {
  try {
    const params = new URLSearchParams({ q: query });
    if (owner) {
      params.append('owner', owner);
    }
    
    const response = await fetch(`${API_URL}/api/tokens/search?${params}`, {
      // Cache search results for 2 minutes
      next: { revalidate: 120 }
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
      // Don't cache upload requests
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
      // Don't cache upload requests
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
