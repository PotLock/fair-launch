import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import type { CreateTokenRequest } from '../types';

// Response types for better type safety
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface TokenData {
  id: number;
  address: string;
  name: string;
  symbol: string;
  allocations?: any[];
  [key: string]: any;
}

interface CreateTokenResponse {
  tokenId: number;
}

// Mock server setup
let app: Hono;
let server: any;
const BASE_URL = 'http://localhost:3001';

// Test data
const mockTokenData: CreateTokenRequest = {
  address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  selectedTemplate: 'utility',
  selectedPricing: 'bonding-curve',
  selectedExchange: 'raydium',
  basicInfo: {
    name: 'Test Token',
    symbol: 'TEST',
    description: 'A test token for API testing',
    supply: '1000000',
    decimals: '9',
    avatarUrl: 'https://example.com/avatar.png',
    bannerUrl: 'https://example.com/banner.png',
  },
  socials: {
    website: 'https://testtoken.com',
    twitter: 'https://twitter.com/testtoken',
    telegram: 'https://t.me/testtoken',
    discord: 'https://discord.gg/testtoken',
    farcaster: 'https://farcaster.xyz/testtoken',
  },
  allocation: [
    {
      description: 'Team allocation',
      percentage: 20,
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      lockupPeriod: 12,
      vesting: {
        enabled: true,
        description: 'Team vesting',
        percentage: 100,
        cliff: 6,
        duration: 24,
        interval: 1,
      },
    },
    {
      description: 'Public sale',
      percentage: 80,
      walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      lockupPeriod: 0,
      vesting: {
        enabled: false,
        description: '',
        percentage: 0,
        cliff: 0,
        duration: 0,
        interval: 0,
      },
    },
  ],
  pricingMechanism: {
    initialPrice: '0.001',
    finalPrice: '0.01',
    targetRaise: '10000',
    reserveRatio: '0.5',
    curveType: 'linear',
  },
  dexListing: {
    launchLiquidityOn: 'raydium',
    liquiditySource: 'wallet',
    liquidityData: { amount: '5000' },
    liquidityType: 'double',
    liquidityPercentage: 50,
    liquidityLockupPeriod: 12,
    isAutoBotProtectionEnabled: true,
    isAutoListingEnabled: true,
    isPriceProtectionEnabled: false,
  },
  fees: {
    mintFee: 0.1,
    transferFee: 0.05,
    burnFee: 0.02,
    feeRecipientAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    adminControls: {
      isEnabled: true,
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    },
  },
  saleSetup: {
    softCap: '5000',
    hardCap: '10000',
    scheduleLaunch: {
      isEnabled: true,
      launchDate: '2024-12-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
    },
    minimumContribution: '10',
    maximumContribution: '1000',
    tokenPrice: '0.001',
    maxTokenPerWallet: '10000',
    distributionDelay: 24,
  },
  adminSetup: {
    revokeMintAuthority: {
      isEnabled: true,
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    },
    revokeFreezeAuthority: {
      isEnabled: true,
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    },
    adminWalletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    adminStructure: 'single',
    tokenOwnerWalletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    numberOfSignatures: 1,
    mintAuthorityWalletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    freezeAuthorityWalletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  },
};

describe('Token API Tests', () => {
  beforeAll(async () => {
    // Import the app dynamically to avoid circular dependencies
    const { default: tokenRoutes } = await import('../routes/tokenRoutes');
    app = new Hono();
    app.route('/tokens', tokenRoutes);
    
    // Start test server
    server = serve({
      fetch: app.fetch,
      port: 3001,
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('POST /tokens - Create Token', () => {
    it('should create a new token successfully', async () => {
      const response = await fetch(`${BASE_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockTokenData),
      });

      expect(response.status).toBe(201);
      
      const result = await response.json() as ApiResponse<CreateTokenResponse>;
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.tokenId).toBeDefined();
      expect(typeof result.data!.tokenId).toBe('number');
    });

    it('should return 400 for invalid token data', async () => {
      const invalidData = {
        ...mockTokenData,
        basicInfo: {
          ...mockTokenData.basicInfo,
          name: '', // Invalid: empty name
        },
      };

      const response = await fetch(`${BASE_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
      
      const result = await response.json() as ApiResponse;
      expect(result.success).toBe(false);
      expect(result.message).toContain('Validation error');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        selectedTemplate: 'utility',
        // Missing other required fields
      };

      const response = await fetch(`${BASE_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incompleteData),
      });

      expect(response.status).toBe(400);
      
      const result = await response.json() as ApiResponse;
      expect(result.success).toBe(false);
    });
  });

  describe('GET /tokens - Get All Tokens', () => {
    it('should retrieve all tokens successfully', async () => {
      const response = await fetch(`${BASE_URL}/tokens`);

      expect(response.status).toBe(200);
      
      const result = await response.json() as ApiResponse<TokenData[]>;
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      
      // Check if tokens have required fields
      if (result.data && result.data.length > 0) {
        const token = result.data[0];
        expect(token!.id).toBeDefined();
        expect(token!.name).toBeDefined();
        expect(token!.symbol).toBeDefined();
        expect(token!.address).toBeDefined();
      }
    });
  });

  describe('GET /tokens/:id - Get Token by ID', () => {
    let createdTokenId: number;

    beforeAll(async () => {
      // Create a token first to get its ID
      const response = await fetch(`${BASE_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockTokenData),
      });

      const result = await response.json() as ApiResponse<CreateTokenResponse>;
      createdTokenId = result.data!.tokenId;
    });

    it('should retrieve a token by ID successfully', async () => {
      const response = await fetch(`${BASE_URL}/tokens/${createdTokenId}`);

      expect(response.status).toBe(200);
      
      const result = await response.json() as ApiResponse<TokenData>;
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(createdTokenId);
      expect(result.data!.name).toBe(mockTokenData.basicInfo.name);
      expect(result.data!.symbol).toBe(mockTokenData.basicInfo.symbol);
      expect(result.data!.allocations).toBeDefined();
      expect(Array.isArray(result.data!.allocations)).toBe(true);
    });

    it('should return 400 for invalid token ID format', async () => {
      const response = await fetch(`${BASE_URL}/tokens/invalid-id`);

      expect(response.status).toBe(400);
      
      const result = await response.json() as ApiResponse;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid token ID');
    });

    it('should return 404 for non-existent token ID', async () => {
      const response = await fetch(`${BASE_URL}/tokens/999999`);

      expect(response.status).toBe(404);
      
      const result = await response.json() as ApiResponse;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Token not found');
    });
  });

  describe('GET /tokens/address/:address - Get Token by Address', () => {
    let createdTokenAddress: string;

    beforeAll(async () => {
      // Create a token first to get its address
      const response = await fetch(`${BASE_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockTokenData),
      });

      const result = await response.json() as ApiResponse<CreateTokenResponse>;
      // Get the created token to find its address
      const tokenResponse = await fetch(`${BASE_URL}/tokens/${result.data!.tokenId}`);
      const tokenResult = await tokenResponse.json() as ApiResponse<TokenData>;
      createdTokenAddress = tokenResult.data!.address;
    });

    it('should retrieve a token by address successfully', async () => {
      const response = await fetch(`${BASE_URL}/tokens/address/${createdTokenAddress}`);

      expect(response.status).toBe(200);
      
      const result = await response.json() as ApiResponse<TokenData>;
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.address).toBe(createdTokenAddress);
      expect(result.data!.name).toBe(mockTokenData.basicInfo.name);
      expect(result.data!.symbol).toBe(mockTokenData.basicInfo.symbol);
    });

    it('should return 400 for empty address', async () => {
      const response = await fetch(`${BASE_URL}/tokens/address/`);

      expect(response.status).toBe(400);
      
      const result = await response.json() as ApiResponse;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Token address is required');
    });

    it('should return 404 for non-existent token address', async () => {
      const response = await fetch(`${BASE_URL}/tokens/address/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`);

      expect(response.status).toBe(404);
      
      const result = await response.json() as ApiResponse;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Token not found');
    });
  });
}); 