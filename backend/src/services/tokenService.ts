import { db } from '../../db/connection';
import { 
  tokens, 
  tokenMetadata, 
  dbcConfigs, 
  buildCurveParams, 
  lockedVestingParams, 
  baseFeeParams, 
  feeSchedulerParams, 
  rateLimiterParams, 
  migrationFees, 
  migratedPoolFees
} from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { 
  CreateTokenRequest, 
  TokenConfig, 
  DBCConfig, 
  BaseFeeParams,
  TokenWithRelations,
  DbcConfigWithRelations,
  CleanTokenResponse,
} from '../types';
import { Connection, PublicKey } from '@solana/web3.js';
import { getRpcSOLEndpoint } from '../lib/sol';

export class TokenService {
  private formatTokenResponseClean(token: TokenWithRelations, dbcConfig?: DbcConfigWithRelations | null): CleanTokenResponse {
    // Helper function to remove internal IDs from nested objects
    const removeInternalIds = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      // Handle Date objects properly
      if (obj instanceof Date) {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => removeInternalIds(item));
      }
      
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip internal database IDs and relation IDs but keep the main token ID
        if ((key === 'id' && obj !== token) || 
            key === 'dbcConfigId' || 
            key === 'baseFeeParamsId' || 
            key === 'tokenId') {
          continue;
        }
        
        cleaned[key] = removeInternalIds(value);
      }
      return cleaned;
    };

    const cleanedDbcConfig = dbcConfig ? removeInternalIds(dbcConfig) : undefined;

    return {
      id: token.id, // Keep only the main token ID
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      totalSupply: token.totalSupply,
      decimals: token.decimals,
      mintAddress: token.mintAddress,
      owner: token.owner,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      metadata: token.metadata ? removeInternalIds(token.metadata) : undefined,
      dbcConfig: cleanedDbcConfig,
    };
  }

  async createToken(tokenData: CreateTokenRequest): Promise<{ success: boolean; tokenId: string; dbcConfigId: string }> {
    try {
      // Insert main token data
      const [token] = await db.insert(tokens).values({
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description,
        totalSupply: tokenData.totalSupply,
        decimals: parseInt(tokenData.decimals),
        mintAddress: tokenData.mintAddress,
        owner: tokenData.owner,
      }).returning();

      if (!token) {
        throw new Error('Failed to create token');
      }

      // Insert token metadata if provided
      if (tokenData.tokenUri || tokenData.bannerUri || tokenData.website || tokenData.twitter || tokenData.telegram) {
        await db.insert(tokenMetadata).values({
          tokenId: token.id,
          tokenUri: tokenData.tokenUri,
          bannerUri: tokenData.bannerUri,
          website: tokenData.website,
          twitter: tokenData.twitter,
          telegram: tokenData.telegram,
        });
      }

      // Always create DBC config as part of token creation flow
      const dbcConfigResult = await this.createDBCConfig(token.id, tokenData.tokenConfig);

      return { 
        success: true, 
        tokenId: token.id,
        dbcConfigId: dbcConfigResult.dbcConfigId
      };
    } catch (error) {
      console.error('Error creating token:', error);
      throw new Error('Failed to create token');
    }
  }

  async createDBCConfig(tokenId: string, tokenConfig: TokenConfig): Promise<{ success: boolean; dbcConfigId: string }> {
    try {
      // Insert DBC configuration
      const [dbcConfig] = await db.insert(dbcConfigs).values({
        tokenId: tokenId,
        quoteMint: tokenConfig.quoteMint,
        buildCurveMode: tokenConfig.dbcConfig.buildCurveMode,
        totalTokenSupply: tokenConfig.dbcConfig.totalTokenSupply.toString(),
        migrationOption: tokenConfig.dbcConfig.migrationOption,
        tokenBaseDecimal: tokenConfig.dbcConfig.tokenBaseDecimal,
        tokenQuoteDecimal: tokenConfig.dbcConfig.tokenQuoteDecimal,
        dynamicFeeEnabled: tokenConfig.dbcConfig.dynamicFeeEnabled,
        activationType: tokenConfig.dbcConfig.activationType,
        collectFeeMode: tokenConfig.dbcConfig.collectFeeMode,
        migrationFeeOption: tokenConfig.dbcConfig.migrationFeeOption,
        tokenType: tokenConfig.dbcConfig.tokenType,
        partnerLpPercentage: tokenConfig.dbcConfig.partnerLpPercentage.toString(),
        creatorLpPercentage: tokenConfig.dbcConfig.creatorLpPercentage.toString(),
        partnerLockedLpPercentage: tokenConfig.dbcConfig.partnerLockedLpPercentage.toString(),
        creatorLockedLpPercentage: tokenConfig.dbcConfig.creatorLockedLpPercentage.toString(),
        creatorTradingFeePercentage: tokenConfig.dbcConfig.creatorTradingFeePercentage.toString(),
        leftover: tokenConfig.dbcConfig.leftover.toString(),
        tokenUpdateAuthority: tokenConfig.dbcConfig.tokenUpdateAuthority,
        leftoverReceiver: tokenConfig.dbcConfig.leftoverReceiver,
        feeClaimer: tokenConfig.dbcConfig.feeClaimer,
      }).returning();

      if (!dbcConfig) {
        throw new Error('Failed to create DBC config');
      }

      // Insert build curve parameters based on mode
      await this.insertBuildCurveParams(dbcConfig.id, tokenConfig.dbcConfig);

      // Insert locked vesting parameters
      await db.insert(lockedVestingParams).values({
        dbcConfigId: dbcConfig.id,
        totalLockedVestingAmount: tokenConfig.dbcConfig.lockedVestingParam.totalLockedVestingAmount.toString(),
        numberOfVestingPeriod: tokenConfig.dbcConfig.lockedVestingParam.numberOfVestingPeriod,
        cliffUnlockAmount: tokenConfig.dbcConfig.lockedVestingParam.cliffUnlockAmount.toString(),
        totalVestingDuration: tokenConfig.dbcConfig.lockedVestingParam.totalVestingDuration,
        cliffDurationFromMigrationTime: tokenConfig.dbcConfig.lockedVestingParam.cliffDurationFromMigrationTime,
      });

      // Insert base fee parameters
      const [baseFeeParam] = await db.insert(baseFeeParams).values({
        dbcConfigId: dbcConfig.id,
        baseFeeMode: tokenConfig.dbcConfig.baseFeeParams.baseFeeMode,
      }).returning();

      if (baseFeeParam) {
        await this.insertFeeParams(baseFeeParam.id, tokenConfig.dbcConfig.baseFeeParams);
      }

      // Insert migration fee
      await db.insert(migrationFees).values({
        dbcConfigId: dbcConfig.id,
        feePercentage: tokenConfig.dbcConfig.migrationFee.feePercentage.toString(),
        creatorFeePercentage: tokenConfig.dbcConfig.migrationFee.creatorFeePercentage.toString(),
      });

      // Insert migrated pool fee if applicable
      if (tokenConfig.dbcConfig.migrationOption === 1 && tokenConfig.dbcConfig.migrationFeeOption === 6) {
        await db.insert(migratedPoolFees).values({
          dbcConfigId: dbcConfig.id,
          collectFeeMode: tokenConfig.dbcConfig.migratedPoolFee?.collectFeeMode || 0,
          dynamicFee: tokenConfig.dbcConfig.migratedPoolFee?.dynamicFee || 0,
          poolFeeBps: tokenConfig.dbcConfig.migratedPoolFee?.poolFeeBps || 100,
        });
      }

      return { success: true, dbcConfigId: dbcConfig.id };
    } catch (error) {
      console.error('Error creating DBC config:', error);
      throw new Error('Failed to create DBC config');
    }
  }

  private async insertBuildCurveParams(dbcConfigId: string, dbcConfig: DBCConfig) {
    const params: any = {
      dbcConfigId: dbcConfigId,
      buildCurveMode: dbcConfig.buildCurveMode,
    };

    // Always include all possible parameters if they exist, regardless of buildCurveMode
    // This allows for more flexible configuration
    if (dbcConfig.percentageSupplyOnMigration !== undefined) {
      params.percentageSupplyOnMigration = dbcConfig.percentageSupplyOnMigration.toString();
    }
    if (dbcConfig.migrationQuoteThreshold !== undefined) {
      params.migrationQuoteThreshold = dbcConfig.migrationQuoteThreshold.toString();
    }
    if (dbcConfig.initialMarketCap !== undefined) {
      params.initialMarketCap = dbcConfig.initialMarketCap.toString();
    }
    if (dbcConfig.migrationMarketCap !== undefined) {
      params.migrationMarketCap = dbcConfig.migrationMarketCap.toString();
    }
    if (dbcConfig.liquidityWeights !== undefined) {
      params.liquidityWeights = dbcConfig.liquidityWeights;
    }

    await db.insert(buildCurveParams).values(params);
  }

  private async insertFeeParams(baseFeeParamsId: string, baseFeeParams: BaseFeeParams) {
    if (baseFeeParams.baseFeeMode === 0 || baseFeeParams.baseFeeMode === 1) {
      // Fee Scheduler (Linear or Exponential)
      if (baseFeeParams.feeSchedulerParam) {
        await db.insert(feeSchedulerParams).values({
          baseFeeParamsId: baseFeeParamsId,
          startingFeeBps: baseFeeParams.feeSchedulerParam.startingFeeBps,
          endingFeeBps: baseFeeParams.feeSchedulerParam.endingFeeBps,
          numberOfPeriod: baseFeeParams.feeSchedulerParam.numberOfPeriod,
          totalDuration: baseFeeParams.feeSchedulerParam.totalDuration,
        });
      }
    } else if (baseFeeParams.baseFeeMode === 2) {
      // Rate Limiter
      if (baseFeeParams.rateLimiterParam) {
        await db.insert(rateLimiterParams).values({
          baseFeeParamsId: baseFeeParamsId,
          baseFeeBps: baseFeeParams.rateLimiterParam.baseFeeBps,
          feeIncrementBps: baseFeeParams.rateLimiterParam.feeIncrementBps,
          referenceAmount: baseFeeParams.rateLimiterParam.referenceAmount.toString(),
          maxLimiterDuration: baseFeeParams.rateLimiterParam.maxLimiterDuration,
        });
      }
    }
  }

  async getTokenById(id: string): Promise<CleanTokenResponse> {
    try {
      const token = await db.query.tokens.findFirst({
        where: eq(tokens.id, id),
        with: {
          metadata: true,
          dbcConfig: {
            with: {
              buildCurveParams: true,
              lockedVestingParams: true,
              baseFeeParams: {
                with: {
                  feeSchedulerParams: true,
                  rateLimiterParams: true,
                }
              },
              migrationFee: true,
              migratedPoolFee: true,
            }
          }
        },
      });

      if (!token) {
        throw new Error('Token not found');
      }

      return this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
    } catch (error) {
      console.error('Error getting token:', error);
      throw new Error('Failed to get token');
    }
  }

  async getTokenByAddress(address: string): Promise<CleanTokenResponse | null> {
    try {
      const token = await db.query.tokens.findFirst({
        where: eq(tokens.mintAddress, address),
        with: {
          metadata: true,
          dbcConfig: {
            with: {
              buildCurveParams: true,
              lockedVestingParams: true,
              baseFeeParams: {
                with: {
                  feeSchedulerParams: true,
                  rateLimiterParams: true,
                }
              },
              migrationFee: true,
              migratedPoolFee: true,
            }
          }
        },
      });

      if (!token) {
        return null;
      }

      return this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
    } catch (error) {
      console.error('Error getting token by address:', error);
      return null;
    }
  }

  async getAllTokens(): Promise<CleanTokenResponse[]> {
    try {
      const allTokens = await db.query.tokens.findMany({
        with: {
          metadata: true,
          dbcConfig: {
            with: {
              buildCurveParams: true,
              lockedVestingParams: true,
              baseFeeParams: {
                with: {
                  feeSchedulerParams: true,
                  rateLimiterParams: true,
                }
              },
              migrationFee: true,
              migratedPoolFee: true,
            }
          }
        },
        orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
      });

      return allTokens.map(token => this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations));
    } catch (error) {
      console.error('Error getting all tokens:', error);
      throw new Error('Failed to get tokens');
    }
  }

  async getTokensByOwner(owner: string): Promise<CleanTokenResponse[]> {
    try {
      const tokensByOwner = await db.query.tokens.findMany({
        where: eq(tokens.owner, owner),
        with: {
          metadata: true,
          dbcConfig: {
            with: {
              buildCurveParams: true,
              lockedVestingParams: true,
              baseFeeParams: {
                with: {
                  feeSchedulerParams: true,
                  rateLimiterParams: true,
                }
              },
              migrationFee: true,
              migratedPoolFee: true,
            }
          }
        },
        orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
      });
      return tokensByOwner.map(token => this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations));
    } catch (error) {
      console.error('Error getting tokens by owner:', error);
      throw new Error('Failed to get tokens by owner');
    }
  }

  async deleteToken(id: string): Promise<{ success: boolean }> {
    try {
      await db.delete(tokens).where(eq(tokens.id, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting token:', error);
      throw new Error('Failed to delete token');
    }
  }

  async searchTokens(query: string, owner?: string): Promise<CleanTokenResponse[]> {
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
          metadata: true,
          dbcConfig: {
            with: {
              buildCurveParams: true,
              lockedVestingParams: true,
              baseFeeParams: {
                with: {
                  feeSchedulerParams: true,
                  rateLimiterParams: true,
                }
              },
              migrationFee: true,
              migratedPoolFee: true,
            }
          }
        },
        orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
      });

      return searchResults.map(token => this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations));
    } catch (error) {
      console.error('Error searching tokens:', error);
      throw new Error('Failed to search tokens');
    }
  }

  async getHoldersByMintAddress(mintAddress: string): Promise<string[]> {
    const connection = new Connection(getRpcSOLEndpoint());
    
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    
    const tokenAccounts = await connection.getProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          { dataSize: 165 },
          { 
            memcmp: { 
              offset: 0, 
              bytes: new PublicKey(mintAddress).toBase58() 
            } 
          },
        ],
        encoding: "base64",
      }
    );
  
    const holders = tokenAccounts.map((acc) => {
      const data = Buffer.from(acc.account.data as unknown as ArrayBuffer);
      const ownerOffset = 32;
      const ownerBytes = data.slice(ownerOffset, ownerOffset + 32);
      return new PublicKey(ownerBytes).toBase58();
    });
    
    return holders.filter((holder) => holder !== mintAddress);
  }

  async getPopularTokens(limit: number): Promise<CleanTokenResponse[]> {
    try {
      // Get all tokens with their relations
      const allTokens = await db.query.tokens.findMany({
        with: {
          metadata: true,
          dbcConfig: {
            with: {
              buildCurveParams: true,
              lockedVestingParams: true,
              baseFeeParams: {
                with: {
                  feeSchedulerParams: true,
                  rateLimiterParams: true,
                }
              },
              migrationFee: true,
              migratedPoolFee: true,
            }
          }
        },
        orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
      });

      // Calculate popularity score for each token
      const tokensWithScore = await Promise.all(
        allTokens.map(async (token) => {
          try {
            if (!token.mintAddress) {
              throw new Error('Token mint address is required');
            }
            const holders = await this.getHoldersByMintAddress(token.mintAddress);
            const holderCount = holders.length;
            
            const now = new Date();
            const daysSinceCreation = Math.max(1, (now.getTime() - token.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const recencyScore = Math.max(0, 30 - daysSinceCreation);
            
            const holderScore = Math.log(Math.max(1, holderCount + 1));
            
            // Combined popularity score
            const popularityScore = recencyScore + holderScore;
            
            return {
              token: token as TokenWithRelations,
              popularityScore,
              holderCount
            };
          } catch (error) {
            console.error(`Error calculating popularity for token ${token.id}:`, error);
            // If we can't get holder count, just use recency
            const now = new Date();
            const daysSinceCreation = Math.max(1, (now.getTime() - token.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const recencyScore = Math.max(0, 30 - daysSinceCreation);
            
            return {
              token: token as TokenWithRelations,
              popularityScore: recencyScore,
              holderCount: 0
            };
          }
        })
      );

      // Sort by popularity score (descending) and take the limit
      const popularTokens = tokensWithScore
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, limit)
        .map(item => this.formatTokenResponseClean(item.token, item.token.dbcConfig as DbcConfigWithRelations));

      return popularTokens;
    } catch (error) {
      console.error('Error getting popular tokens:', error);
      throw new Error('Failed to get popular tokens');
    }
  }
}