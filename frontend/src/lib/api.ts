import { 
  BasicInformation, 
  Socials, 
  TokenDistributionItem, 
  LiquiditySourceData, 
  Fees, 
  TokenSaleSetup, 
  AdminSetup, 
  PricingMechanismData 
} from '../types';

export interface DexListing {
    launchLiquidityOn: string;
    liquiditySource: 'wallet' | 'sale' | 'bonding' | 'team' | 'external' | 'hybrid';
    liquidityData: LiquiditySourceData;
    liquidityType?: 'double' | 'single';
    liquidityPercentage: number;
    liquidityLockupPeriod: number;
    walletLiquidityAmount?: number;
    externalSolContribution?: number;
    isAutoBotProtectionEnabled: boolean;
    isAutoListingEnabled: boolean;
    isPriceProtectionEnabled: boolean;
}

export interface CreateTokenRequest {
    owner: string;
    mintAddress: string;
    basicInfo: BasicInformation;
    socials: Socials;
    allocation: TokenDistributionItem[];
    dexListing: DexListing;
    fees: Fees;
    saleSetup: TokenSaleSetup;
    adminSetup: AdminSetup;
    pricingMechanism: PricingMechanismData;
    selectedTemplate: string;
    selectedPricing: string;
    selectedExchange: string;
}

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

export async function getTokenByAddress(address: string) {
  try {
    const response = await fetch(`${API_URL}/api/tokens/address/${address}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting token by address:', error);
    throw new Error('Failed to get token by address');
  }
}

export async function getTokenByMint(mint: string) {
  try {
    const response = await fetch(`${API_URL}/api/tokens/mint/${mint}`);
    const result = await response.json();
    return result;
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