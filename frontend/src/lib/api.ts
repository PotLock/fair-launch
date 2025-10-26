import { CreateTokenRequest, Token } from '../types';


const API_URL = process.env.PUBLIC_API_URL;

export async function createToken(tokenData: CreateTokenRequest) {
  try {
    const response = await fetch(`${API_URL}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData),
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
    const response = await fetch(`${API_URL}/api/tokens/address/${address}`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error getting token by address:', error);
    throw new Error('Failed to get token by address');
  }
}

export async function getTokenByMint(mint: string): Promise<Token> {
  try {
    const response = await fetch(`${API_URL}/api/tokens/mint/${mint}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting token by mint:', error);
    throw new Error('Failed to get token by mint');
  }
}

export async function getTokens() {
  try {
    const response = await fetch(`${API_URL}/api/tokens`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Failed to get tokens');
  }
}

export async function searchTokens(query: string, owner?: string) {
  try {
    const params = new URLSearchParams({ q: query });
    if (owner) {
      params.append('owner', owner);
    }
    
    const response = await fetch(`${API_URL}/api/tokens/search?${params}`);
    
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