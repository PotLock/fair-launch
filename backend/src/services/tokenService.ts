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
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import type { 
  CreateTokenRequest, 
  TokenConfig, 
  DBCConfig, 
  BaseFeeParams,
  TokenWithRelations,
  DbcConfigWithRelations,
  CleanTokenResponse,
  UpdateTokenRequest,
} from '../types';
import { Connection, PublicKey } from '@solana/web3.js';
import { getRpcSOLEndpoint } from '../lib/sol';
import { formatTokenResponseWithMetrics } from '../lib/tokenFormatter';
import { fetchTokenMetrics } from '../lib/parallelFetcher';
import { cacheService, CACHE_TTL } from './cacheService';
import { validateDbcConfigRelations } from '../lib/dbcValidator';
import { decimalToString } from '../lib/numberUtils';
import { HalfbakService } from './halfbakService';

export class TokenService {
  private halfbakService: HalfbakService;

  constructor() {
    this.halfbakService = new HalfbakService();
  }

  /**
   * Fetches metrics for a token, using cache when available.
   * Returns default metrics if fetch fails.
   */
  private async getTokenMetrics(mintAddress: string, totalSupply: string, decimals: number): Promise<any> {
    // Check cache first
    const cacheKey = `token:${mintAddress}:metrics`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch metrics in parallel
    const metrics = await fetchTokenMetrics(
      mintAddress,
      totalSupply,
      decimals,
      this,
      this.halfbakService
    );

    // Cache the result
    cacheService.set(cacheKey, metrics, CACHE_TTL.METRICS);

    return metrics;
  }

  /**
   * Formats token response with metrics included.
   * Ensures all required fields are present.
   */
  private async formatTokenResponseClean(
    token: TokenWithRelations, 
    dbcConfig?: DbcConfigWithRelations | null,
    includeMetrics: boolean = true
  ): Promise<CleanTokenResponse> {
    // Validate DBC config if present
    if (dbcConfig) {
      try {
        validateDbcConfigRelations(dbcConfig);
      } catch (error) {
        console.warn(`DBC config validation warning for token ${token.id}:`, error);
        // Continue anyway - we'll still return the token
      }
    }

    // Fetch metrics if requested
    let metrics: any = {
      price: '0',
      holders: 0,
      marketCap: '0',
      supply: decimalToString(token.totalSupply),
    };

    if (includeMetrics && token.mintAddress) {
      try {
        metrics = await this.getTokenMetrics(
          token.mintAddress,
          decimalToString(token.totalSupply),
          token.decimals
        );
      } catch (error) {
        console.error(`Error fetching metrics for token ${token.mintAddress}:`, error);
        // Use defaults - metrics already set above
      }
    }

    // Use the formatter utility
    return formatTokenResponseWithMetrics(token, metrics, dbcConfig);
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
        launchpad: tokenData.launchpad || 'potlaunch',
        tags: tokenData.tags ?? [],
        active: tokenData.active ?? true,
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

      // Validate the created DBC config
      const createdDbcConfig = await db.query.dbcConfigs.findFirst({
        where: eq(dbcConfigs.id, dbcConfigResult.dbcConfigId),
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
        },
      });

      if (createdDbcConfig) {
        try {
          validateDbcConfigRelations(createdDbcConfig as DbcConfigWithRelations);
        } catch (error) {
          console.error('DBC config validation failed after creation:', error);
          // Log but don't fail - the config was created
        }
      }

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
    // Ensure all fields are properly converted to strings for decimal fields
    if (dbcConfig.percentageSupplyOnMigration !== undefined) {
      params.percentageSupplyOnMigration = decimalToString(dbcConfig.percentageSupplyOnMigration);
    }
    if (dbcConfig.migrationQuoteThreshold !== undefined) {
      params.migrationQuoteThreshold = decimalToString(dbcConfig.migrationQuoteThreshold);
    }
    if (dbcConfig.initialMarketCap !== undefined) {
      params.initialMarketCap = decimalToString(dbcConfig.initialMarketCap);
    }
    if (dbcConfig.migrationMarketCap !== undefined) {
      params.migrationMarketCap = decimalToString(dbcConfig.migrationMarketCap);
    }
    if (dbcConfig.liquidityWeights !== undefined) {
      params.liquidityWeights = dbcConfig.liquidityWeights;
    }

    // Always insert buildCurveParams - it's required
    await db.insert(buildCurveParams).values(params);
  }

  private async insertFeeParams(baseFeeParamsId: string, baseFeeParams: BaseFeeParams) {
    if (baseFeeParams.baseFeeMode === 0 || baseFeeParams.baseFeeMode === 1) {
      // Fee Scheduler (Linear or Exponential)
      // Always create feeSchedulerParams - it's required for these modes
      if (baseFeeParams.feeSchedulerParam) {
        await db.insert(feeSchedulerParams).values({
          baseFeeParamsId: baseFeeParamsId,
          startingFeeBps: baseFeeParams.feeSchedulerParam.startingFeeBps,
          endingFeeBps: baseFeeParams.feeSchedulerParam.endingFeeBps,
          numberOfPeriod: baseFeeParams.feeSchedulerParam.numberOfPeriod,
          totalDuration: baseFeeParams.feeSchedulerParam.totalDuration,
        });
      } else {
        // Create default fee scheduler params if not provided
        await db.insert(feeSchedulerParams).values({
          baseFeeParamsId: baseFeeParamsId,
          startingFeeBps: 100, // 1%
          endingFeeBps: 100, // 1%
          numberOfPeriod: 0,
          totalDuration: 0,
        });
      }
    } else if (baseFeeParams.baseFeeMode === 2) {
      // Rate Limiter
      // Always create rateLimiterParams - it's required for this mode
      if (baseFeeParams.rateLimiterParam) {
        await db.insert(rateLimiterParams).values({
          baseFeeParamsId: baseFeeParamsId,
          baseFeeBps: baseFeeParams.rateLimiterParam.baseFeeBps,
          feeIncrementBps: baseFeeParams.rateLimiterParam.feeIncrementBps,
          referenceAmount: decimalToString(baseFeeParams.rateLimiterParam.referenceAmount),
          maxLimiterDuration: baseFeeParams.rateLimiterParam.maxLimiterDuration,
        });
      } else {
        // Create default rate limiter params if not provided
        await db.insert(rateLimiterParams).values({
          baseFeeParamsId: baseFeeParamsId,
          baseFeeBps: 100, // 1%
          feeIncrementBps: 10, // 0.1%
          referenceAmount: '0',
          maxLimiterDuration: 0,
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

      // Validate DBC config if present
      if (token.dbcConfig) {
        try {
          validateDbcConfigRelations(token.dbcConfig as DbcConfigWithRelations);
        } catch (error) {
          console.warn(`DBC config validation warning for token ${id}:`, error);
        }
      }

      return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
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

      // Validate DBC config if present
      if (token.dbcConfig) {
        try {
          validateDbcConfigRelations(token.dbcConfig as DbcConfigWithRelations);
        } catch (error) {
          console.warn(`DBC config validation warning for token ${address}:`, error);
        }
      }

      return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
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

      // Fetch metrics for all tokens in parallel using Promise.allSettled
      // This ensures we get results even if some RPC calls fail
      const tokensWithMetrics = await Promise.allSettled(
        allTokens.map(async (token) => {
          try {
            // Validate DBC config if present
            if (token.dbcConfig) {
              try {
                validateDbcConfigRelations(token.dbcConfig as DbcConfigWithRelations);
              } catch (error) {
                console.warn(`DBC config validation warning for token ${token.id}:`, error);
              }
            }
            return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
          } catch (error) {
            console.error(`Error formatting token ${token.id}:`, error);
            // Return token with default metrics if formatting fails
            return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
          }
        })
      );

      // Extract successful results, use defaults for failed ones
      return tokensWithMetrics.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // If formatting failed, return token with default metrics
          const token = allTokens[index];
          if (!token) {
            throw new Error(`Token at index ${index} is undefined`);
          }
          return formatTokenResponseWithMetrics(
            token as TokenWithRelations,
            {
              price: '0',
              holders: 0,
              marketCap: '0',
              supply: decimalToString(token.totalSupply),
            },
            token.dbcConfig as DbcConfigWithRelations
          );
        }
      });
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

      // Fetch metrics in parallel
      const tokensWithMetrics = await Promise.allSettled(
        tokensByOwner.map(async (token) => {
          try {
            if (token.dbcConfig) {
              try {
                validateDbcConfigRelations(token.dbcConfig as DbcConfigWithRelations);
              } catch (error) {
                console.warn(`DBC config validation warning for token ${token.id}:`, error);
              }
            }
            return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
          } catch (error) {
            console.error(`Error formatting token ${token.id}:`, error);
            return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
          }
        })
      );

      return tokensWithMetrics.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const token = tokensByOwner[index];
          if (!token) {
            throw new Error(`Token at index ${index} is undefined`);
          }
          return formatTokenResponseWithMetrics(
            token as TokenWithRelations,
            {
              price: '0',
              holders: 0,
              marketCap: '0',
              supply: decimalToString(token.totalSupply),
            },
            token.dbcConfig as DbcConfigWithRelations
          );
        }
      });
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

  async updateToken(id: string, updates: UpdateTokenRequest): Promise<CleanTokenResponse> {
    try {
      if (!id || id.trim() === '') {
        throw new Error('Token ID is required');
      }

      const values: any = {};
      if (updates.name !== undefined) values.name = updates.name;
      if (updates.symbol !== undefined) values.symbol = updates.symbol;
      if (updates.description !== undefined) values.description = updates.description;
      if (updates.totalSupply !== undefined) values.totalSupply = updates.totalSupply;
      if (updates.decimals !== undefined) values.decimals = parseInt(updates.decimals, 10);
      if (updates.mintAddress !== undefined) values.mintAddress = updates.mintAddress;
      if (updates.owner !== undefined) values.owner = updates.owner;
      if (updates.launchpad !== undefined) values.launchpad = updates.launchpad;
      if (updates.tags !== undefined) values.tags = updates.tags;
      if (updates.active !== undefined) values.active = updates.active;

      // Always update updatedAt
      values.updatedAt = new Date();

      const [updated] = await db
        .update(tokens)
        .set(values)
        .where(eq(tokens.id, id))
        .returning();

      if (!updated) {
        throw new Error('Token not found');
      }

      // Return full clean token with relations
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

      // Validate DBC config if present
      if (token.dbcConfig) {
        try {
          validateDbcConfigRelations(token.dbcConfig as DbcConfigWithRelations);
        } catch (error) {
          console.warn(`DBC config validation warning for token ${id}:`, error);
        }
      }

      return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
    } catch (error) {
      console.error('Error updating token:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update token');
    }
  }

  async searchTokens(query: string, owner?: string, launchpad?: string, active?: boolean, tag?: string, startDate?: string, endDate?: string): Promise<CleanTokenResponse[]> {
    try {
      const { ilike, or, and: andDyn, eq: eqDyn, sql: sqlDyn, gte: gteDyn, lte: lteDyn } = await import('drizzle-orm');
      
      const searchConditions = [
        ilike(tokens.name, `%${query}%`),
        ilike(tokens.symbol, `%${query}%`),
        ilike(tokens.description, `%${query}%`),
        ilike(tokens.mintAddress, `%${query}%`),
      ];

      let whereCondition = or(...searchConditions);
      
      // If owner is provided, filter by owner as well
      if (owner) {
        whereCondition = andDyn(whereCondition, eqDyn(tokens.owner, owner));
      }

      // If launchpad is provided, filter by launchpad as well
      if (launchpad && (launchpad === 'potlaunch' || launchpad === 'cookedpad')) {
        whereCondition = andDyn(whereCondition, eqDyn(tokens.launchpad, launchpad as 'potlaunch' | 'cookedpad'));
      }

      // If active is provided, filter by active
      if (typeof active === 'boolean') {
        whereCondition = andDyn(whereCondition, eqDyn(tokens.active, active));
      }

      // If tag is provided, filter where tag is in tags array
      if (tag && tag.trim() !== '') {
        whereCondition = andDyn(whereCondition, sqlDyn`${tag} = ANY(${tokens.tags})`);
      }

      // If startDate is provided, filter by createdAt >= startDate
      if (startDate) {
        whereCondition = andDyn(whereCondition, gteDyn(tokens.createdAt, new Date(startDate)));
      }

      // If endDate is provided, filter by createdAt <= endDate
      if (endDate) {
        whereCondition = andDyn(whereCondition, lteDyn(tokens.createdAt, new Date(endDate)));
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

      // Fetch metrics in parallel for all search results
      const tokensWithMetrics = await Promise.allSettled(
        searchResults.map(async (token) => {
          try {
            if (token.dbcConfig) {
              try {
                validateDbcConfigRelations(token.dbcConfig as DbcConfigWithRelations);
              } catch (error) {
                console.warn(`DBC config validation warning for token ${token.id}:`, error);
              }
            }
            return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
          } catch (error) {
            console.error(`Error formatting token ${token.id}:`, error);
            return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
          }
        })
      );

      return tokensWithMetrics.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const token = searchResults[index];
          if (!token) {
            throw new Error(`Token at index ${index} is undefined`);
          }
          return formatTokenResponseWithMetrics(
            token as TokenWithRelations,
            {
              price: '0',
              holders: 0,
              marketCap: '0',
              supply: decimalToString(token.totalSupply),
            },
            token.dbcConfig as DbcConfigWithRelations
          );
        }
      });
    } catch (error) {
      console.error('Error searching tokens:', error);
      throw new Error('Failed to search tokens');
    }
  }

  async getTokensByLaunchpad(launchpad: 'potlaunch' | 'cookedpad'): Promise<CleanTokenResponse[]> {
    try {
      const tokensByLaunchpad = await db.query.tokens.findMany({
        where: eq(tokens.launchpad, launchpad),
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

      // Fetch metrics in parallel
      const tokensWithMetrics = await Promise.allSettled(
        tokensByLaunchpad.map(async (token) => {
          try {
            if (token.dbcConfig) {
              try {
                validateDbcConfigRelations(token.dbcConfig as DbcConfigWithRelations);
              } catch (error) {
                console.warn(`DBC config validation warning for token ${token.id}:`, error);
              }
            }
            return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
          } catch (error) {
            console.error(`Error formatting token ${token.id}:`, error);
            return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
          }
        })
      );

      return tokensWithMetrics.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const token = tokensByLaunchpad[index];
          if (!token) {
            throw new Error(`Token at index ${index} is undefined`);
          }
          return formatTokenResponseWithMetrics(
            token as TokenWithRelations,
            {
              price: '0',
              holders: 0,
              marketCap: '0',
              supply: decimalToString(token.totalSupply),
            },
            token.dbcConfig as DbcConfigWithRelations
          );
        }
      });
    } catch (error) {
      console.error('Error getting tokens by launchpad:', error);
      throw new Error('Failed to get tokens by launchpad');
    }
  }

  // New: filtered listing by optional launchpad, active, tag, and date range
  async getTokensFiltered(launchpad?: 'potlaunch' | 'cookedpad', active?: boolean, tag?: string, startDate?: string, endDate?: string): Promise<CleanTokenResponse[]> {
    try {
      const conditions: any[] = [];
      if (launchpad) {
        conditions.push(eq(tokens.launchpad, launchpad));
      }
      if (typeof active === 'boolean') {
        conditions.push(eq(tokens.active, active));
      }
      if (tag && tag.trim() !== '') {
        conditions.push(sql`${tag} = ANY(${tokens.tags})`);
      }
      if (startDate) {
        conditions.push(gte(tokens.createdAt, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(tokens.createdAt, new Date(endDate)));
      }
      const whereCondition = conditions.length ? and(...conditions) : undefined;

      const filteredTokens = await db.query.tokens.findMany({
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

      // Fetch metrics in parallel
      const tokensWithMetrics = await Promise.allSettled(
        filteredTokens.map(async (token) => {
          try {
            if (token.dbcConfig) {
              try {
                validateDbcConfigRelations(token.dbcConfig as DbcConfigWithRelations);
              } catch (error) {
                console.warn(`DBC config validation warning for token ${token.id}:`, error);
              }
            }
            return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
          } catch (error) {
            console.error(`Error formatting token ${token.id}:`, error);
            return await this.formatTokenResponseClean(token as TokenWithRelations, token.dbcConfig as DbcConfigWithRelations);
          }
        })
      );

      return tokensWithMetrics.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const token = filteredTokens[index];
          if (!token) {
            throw new Error(`Token at index ${index} is undefined`);
          }
          return formatTokenResponseWithMetrics(
            token as TokenWithRelations,
            {
              price: '0',
              holders: 0,
              marketCap: '0',
              supply: decimalToString(token.totalSupply),
            },
            token.dbcConfig as DbcConfigWithRelations
          );
        }
      });
    } catch (error) {
      console.error('Error getting filtered tokens:', error);
      throw new Error('Failed to get filtered tokens');
    }
  }

  async getHoldersByMintAddress(mintAddress: string): Promise<string[]> {
    // Check cache first
    const cacheKey = `token:${mintAddress}:holders`;
    const cached = cacheService.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
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
      
      const filteredHolders = holders.filter((holder) => holder !== mintAddress);
      
      // Cache the result
      cacheService.set(cacheKey, filteredHolders, CACHE_TTL.HOLDERS);
      
      return filteredHolders;
    } catch (error) {
      console.error('Error getting holders by mint address:', error);
      // Return empty array on error, don't cache errors
      return [];
    }
  }

  async getPopularTokens(limit: number, launchpad?: 'potlaunch' | 'cookedpad', active?: boolean, tag?: string, startDate?: string, endDate?: string): Promise<CleanTokenResponse[]> {
    try {
      // Build where condition for filters
      const conditions: any[] = [];
      if (launchpad) {
        conditions.push(eq(tokens.launchpad, launchpad));
      }
      if (typeof active === 'boolean') {
        conditions.push(eq(tokens.active, active));
      }
      if (tag && tag.trim() !== '') {
        conditions.push(sql`${tag} = ANY(${tokens.tags})`);
      }
      if (startDate) {
        conditions.push(gte(tokens.createdAt, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(tokens.createdAt, new Date(endDate)));
      }
      const whereCondition = conditions.length ? and(...conditions) : undefined;

      // Get all tokens with their relations
      const allTokens = await db.query.tokens.findMany({
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

      // Calculate popularity score for each token
      // Fetch holders in parallel for all tokens
      const tokensWithScore = await Promise.allSettled(
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

      // Extract successful results
      const validTokensWithScore = tokensWithScore
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            // Use default score if calculation failed
            const token = allTokens[index];
            if (!token) {
              throw new Error(`Token at index ${index} is undefined`);
            }
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
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, limit);

      // Format tokens with metrics - fetch in parallel
      const formattedTokens = await Promise.allSettled(
        validTokensWithScore.map(async (item) => {
          try {
            if (item.token.dbcConfig) {
              try {
                validateDbcConfigRelations(item.token.dbcConfig as DbcConfigWithRelations);
              } catch (error) {
                console.warn(`DBC config validation warning for token ${item.token.id}:`, error);
              }
            }
            return await this.formatTokenResponseClean(item.token, item.token.dbcConfig as DbcConfigWithRelations);
          } catch (error) {
            console.error(`Error formatting token ${item.token.id}:`, error);
            return await this.formatTokenResponseClean(item.token, item.token.dbcConfig as DbcConfigWithRelations);
          }
        })
      );

      // Extract successful results
      const popularTokens = formattedTokens.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const item = validTokensWithScore[index];
          if (!item) {
            throw new Error(`Token item at index ${index} is undefined`);
          }
          return formatTokenResponseWithMetrics(
            item.token,
            {
              price: '0',
              holders: item.holderCount,
              marketCap: '0',
              supply: decimalToString(item.token.totalSupply),
            },
            item.token.dbcConfig as DbcConfigWithRelations
          );
        }
      });

      return popularTokens;
    } catch (error) {
      console.error('Error getting popular tokens:', error);
      throw new Error('Failed to get popular tokens');
    }
  }
}
