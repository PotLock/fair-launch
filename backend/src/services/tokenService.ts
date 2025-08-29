import { db } from '../../db/connection';
import { tokens, tokenAllocations } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { CreateTokenRequest } from '../types';

export class TokenService {
  async createToken(tokenData: CreateTokenRequest) {
    try {
      // Insert main token data
      const [token] = await db.insert(tokens).values({
        mintAddress: tokenData.mintAddress,
        name: tokenData.basicInfo.name,
        symbol: tokenData.basicInfo.symbol,
        description: tokenData.basicInfo.description,
        supply: tokenData.basicInfo.supply,
        decimals: tokenData.basicInfo.decimals,
        avatarUrl: tokenData.basicInfo.avatarUrl,
        bannerUrl: tokenData.basicInfo.bannerUrl,
        
        selectedTemplate: tokenData.selectedTemplate,
        selectedPricing: tokenData.selectedPricing,
        selectedExchange: tokenData.selectedExchange,
        
        website: tokenData.socials.website,
        twitter: tokenData.socials.twitter,
        telegram: tokenData.socials.telegram,
        discord: tokenData.socials.discord,
        farcaster: tokenData.socials.farcaster,
        
        initialPrice: tokenData.pricingMechanism.initialPrice,
        finalPrice: tokenData.pricingMechanism.finalPrice,
        targetRaise: tokenData.pricingMechanism.targetRaise,
        reserveRatio: tokenData.pricingMechanism.reserveRatio,
        curveType: tokenData.pricingMechanism.curveType,
        
        launchLiquidityOnName: tokenData.dexListing.launchLiquidityOn,
        liquiditySource: tokenData.dexListing.liquiditySource,
        liquidityData: tokenData.dexListing.liquidityData,
        liquidityType: tokenData.dexListing.liquidityType,
        liquidityPercentage: tokenData.dexListing.liquidityPercentage,
        liquidityLockupPeriod: tokenData.dexListing.liquidityLockupPeriod,
        isAutoBotProtectionEnabled: tokenData.dexListing.isAutoBotProtectionEnabled,
        isAutoListingEnabled: tokenData.dexListing.isAutoListingEnabled,
        isPriceProtectionEnabled: tokenData.dexListing.isPriceProtectionEnabled,
        
        mintFee: tokenData.fees.mintFee.toString(),
        transferFee: tokenData.fees.transferFee.toString(),
        burnFee: tokenData.fees.burnFee.toString(),
        feeRecipientAddress: tokenData.fees.feeRecipientAddress,
        adminControlsEnabled: tokenData.fees.adminControls.isEnabled,
        adminControlsWalletAddress: tokenData.fees.adminControls.walletAddress,
        
        softCap: tokenData.saleSetup.softCap,
        hardCap: tokenData.saleSetup.hardCap,
        scheduleLaunchEnabled: tokenData.saleSetup.scheduleLaunch.isEnabled,
        launchDate: tokenData.saleSetup.scheduleLaunch.launchDate ? new Date(tokenData.saleSetup.scheduleLaunch.launchDate) : null,
        endDate: tokenData.saleSetup.scheduleLaunch.endDate ? new Date(tokenData.saleSetup.scheduleLaunch.endDate) : null,
        minimumContribution: tokenData.saleSetup.minimumContribution,
        maximumContribution: tokenData.saleSetup.maximumContribution,
        tokenPrice: tokenData.saleSetup.tokenPrice,
        maxTokenPerWallet: tokenData.saleSetup.maxTokenPerWallet,
        distributionDelay: tokenData.saleSetup.distributionDelay,
        
        revokeMintAuthorityEnabled: tokenData.adminSetup.revokeMintAuthority.isEnabled,
        revokeMintAuthorityWalletAddress: tokenData.adminSetup.revokeMintAuthority.walletAddress,
        revokeFreezeAuthorityEnabled: tokenData.adminSetup.revokeFreezeAuthority.isEnabled,
        revokeFreezeAuthorityWalletAddress: tokenData.adminSetup.revokeFreezeAuthority.walletAddress,
        adminWalletAddress: tokenData.adminSetup.adminWalletAddress,
        adminStructure: tokenData.adminSetup.adminStructure,
        tokenOwnerWalletAddress: tokenData.adminSetup.tokenOwnerWalletAddress,
        numberOfSignatures: tokenData.adminSetup.numberOfSignatures,
        mintAuthorityWalletAddress: tokenData.adminSetup.mintAuthorityWalletAddress,
        freezeAuthorityWalletAddress: tokenData.adminSetup.freezeAuthorityWalletAddress,
        owner: tokenData.owner, // Add this line to handle owner
      }).returning();

      // Insert allocations
      if (tokenData.allocation.length > 0 && token) {
        const allocationData = tokenData.allocation.map(allocation => ({
          tokenId: token.id,
          description: allocation.description,
          percentage: allocation.percentage.toString(), // Convert number to string for decimal field
          walletAddress: allocation.walletAddress,
          lockupPeriod: allocation.lockupPeriod,
          vestingEnabled: allocation.vesting.enabled,
          vestingDescription: allocation.vesting.description,
          vestingPercentage: allocation.vesting.percentage.toString(), // Convert number to string for decimal field
          vestingCliff: allocation.vesting.cliff,
          vestingDuration: allocation.vesting.duration,
          vestingInterval: allocation.vesting.interval,
        }));

        await db.insert(tokenAllocations).values(allocationData);
      }

      if (!token) {
        throw new Error('Failed to create token');
      }

      return { success: true, tokenId: token.id };
    } catch (error) {
      console.error('Error creating token:', error);
      throw new Error('Failed to create token');
    }
  }

  async getTokenById(id: number) {
    try {
      const token = await db.query.tokens.findFirst({
        where: eq(tokens.id, id),
        with: {
          allocations: true,
        },
      });

      if (!token) {
        throw new Error('Token not found');
      }

      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw new Error('Failed to get token');
    }
  }

  async getTokenByAddress(address: string) {
    try {
      const token = await db.query.tokens.findFirst({
        where: eq(tokens.mintAddress, address),
        with: {
          allocations: true,
        },
      });

      if (!token) {
        throw new Error('Token not found');
      }

      return token;
    } catch (error) {
      console.error('Error getting token by address:', error);
      throw new Error('Failed to get token');
    }
  }

  async getAllTokens() {
    try {
      const allTokens = await db.query.tokens.findMany({
        with: {
          allocations: true,
        },
        orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
      });

      return allTokens;
    } catch (error) {
      console.error('Error getting all tokens:', error);
      throw new Error('Failed to get tokens');
    }
  }

  async getTokensByOwner(owner: string) {
    try {
      const tokensByOwner = await db.query.tokens.findMany({
        where: eq(tokens.owner, owner),
        with: {
          allocations: true,
        },
        orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
      });
      return tokensByOwner;
    } catch (error) {
      console.error('Error getting tokens by owner:', error);
      throw new Error('Failed to get tokens by owner');
    }
  }

  async deleteToken(id: number) {
    try {
      await db.delete(tokens).where(eq(tokens.id, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting token:', error);
      throw new Error('Failed to delete token');
    }
  }

  async deleteAllTokens() {
    try {
      await db.delete(tokenAllocations);
      // Then delete all tokens
      await db.delete(tokens);
      return { success: true };
    } catch (error) {
      console.error('Error deleting all tokens:', error);
      throw new Error('Failed to delete all tokens');
    }
  }

  async deleteAllAllocations() {
    try {
      await db.delete(tokenAllocations);
      return { success: true };
    } catch (error) {
      console.error('Error deleting all allocations:', error);
      throw new Error('Failed to delete all allocations');
    }
  }

  async searchTokens(query: string, owner?: string) {
    try {
      const { ilike, or, and } = await import('drizzle-orm');
      
      const searchConditions = [
        ilike(tokens.name, `%${query}%`),
        ilike(tokens.symbol, `%${query}%`),
        ilike(tokens.description, `%${query}%`),
        ilike(tokens.mintAddress, `%${query}%`),
      ];

      let whereCondition = or(...searchConditions);
      
      // If owner is provided, filter by owner as well
      if (owner) {
        whereCondition = and(whereCondition, eq(tokens.owner, owner));
      }

      const searchResults = await db.query.tokens.findMany({
        where: whereCondition,
        with: {
          allocations: true,
        },
        orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
      });

      return searchResults;
    } catch (error) {
      console.error('Error searching tokens:', error);
      throw new Error('Failed to search tokens');
    }
  }
} 