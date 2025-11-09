import { z } from "zod";

export interface TokenMetadata {
  uri?: string;
  imageUri?: string;
  bannerUri?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

// Custom Token Creation Schema
export const CustomMintSchema = z.object({
  // --- TOKEN INFO ---
  tokenInfo: z.object({
    name: z.string(),
    symbol: z.string(),
    description: z.string().optional(),
    logo: z.string().optional(),
    banner: z.string().optional(),
    website: z.string().optional(),
    twitter: z.string().optional(),
    telegram: z.string().optional(),
    totalTokenSupply: z.number().positive(),
    tokenBaseDecimal: z.number().min(0),
    tokenQuoteDecimal: z.number().min(0),
    tokenQuoteAddress: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),

  // --- DBC CONFIGURATION ---
  dbcConfig: z.object({
    buildCurveMode: z.enum(["0", "1", "2", "3"]),
    // Mode 0: buildCurve
    percentageSupplyOnMigration: z.number().min(0).max(100).optional(),
    migrationQuoteThreshold: z.number().positive().optional(),
    // Mode 1, 2, 3: Market Cap Based
    initialMarketCap: z.number().positive().optional(),
    migrationMarketCap: z.number().positive().optional(),
    // Mode 3: Liquidity Weights
    liquidityWeights: z.array(z.number()).length(16).optional(),
    // General settings
    migrationOption: z.enum(["0", "1"]),
    dynamicFeeEnabled: z.boolean(),
    activationType: z.enum(["0", "1"]),
    collectFeeMode: z.enum(["0", "1"]),
    migrationFeeOption: z.enum(["0", "1", "2", "3", "4", "5", "6"]),
    tokenType: z.enum(["0", "1"]),
    // Migrated Pool Fee (only for DAMM v2 + Customizable)
    migratedPoolFee: z.object({
      collectFeeMode: z.enum(["0", "1"]),
      dynamicFee: z.enum(["0", "1"]),
      poolFeeBps: z.number().min(10).max(1000),
    }).optional(),
  }),

  // --- FEE CONFIGURATION ---
  baseFeeParams: z.object({
    baseFeeMode: z.enum(["0", "1", "2"]),
    // Mode 0, 1: Fee Scheduler
    feeSchedulerParam: z.object({
      startingFeeBps: z.number().min(0),
      endingFeeBps: z.number().min(0),
      numberOfPeriod: z.number(),
      totalDuration: z.number(),
    }).optional(),
    // Mode 2: Rate Limiter
    rateLimiterParam: z.object({
      baseFeeBps: z.number().min(0).max(9900),
      feeIncrementBps: z.number().min(0),
      referenceAmount: z.number().min(0),
      maxLimiterDuration: z.number().min(0),
    }).optional(),
  }),

  // --- VESTING CONFIGURATION ---
  lockedVestingParam: z.object({
    totalLockedVestingAmount: z.number(),
    numberOfVestingPeriod: z.number(),
    cliffUnlockAmount: z.number(),
    totalVestingDuration: z.number(),
    cliffDurationFromMigrationTime: z.number(),
  }),

  // --- LP CONFIGURATION ---
  lpDistribution: z.object({
    partnerLpPercentage: z.number().min(0).max(100),
    creatorLpPercentage: z.number().min(0).max(100),
    partnerLockedLpPercentage: z.number().min(0).max(100),
    creatorLockedLpPercentage: z.number().min(0).max(100),
    creatorTradingFeePercentage: z.number().min(0).max(100),
    leftover: z.number().min(0),
    // Migration Fee (optional)
    migrationFee: z.object({
      feePercentage: z.number().min(0).max(50),
      creatorFeePercentage: z.number().min(0).max(100),
    }).optional(),
  }),

  // --- MIGRATED POOL FEE (only for DAMM v2 + Custom fee) ---
  migratedPoolFee: z.object({
    collectFeeMode: z.enum(["0", "1"]),
    dynamicFee: z.enum(["0", "1"]),
    poolFeeBps: z.number().min(10).max(1000),
  }).optional(),

  // --- AUTHORITY CONFIGURATION ---
  authority: z.object({
    tokenUpdateAuthority: z.enum(["0", "1", "2", "3", "4"]),
    leftoverReceiver: z.string(),
    feeClaimer: z.string(),
  })
});




// TypeScript types derived from CustomMintSchema
export type CustomMintData = z.infer<typeof CustomMintSchema>;
export type CustomTokenInfo = z.infer<typeof CustomMintSchema>['tokenInfo'];
export type CustomDBCConfig = z.infer<typeof CustomMintSchema>['dbcConfig'];
export type CustomFeeConfig = z.infer<typeof CustomMintSchema>['baseFeeParams'];
export type CustomVestingConfig = z.infer<typeof CustomMintSchema>['lockedVestingParam'];
export type CustomLiquidityConfig = z.infer<typeof CustomMintSchema>['lpDistribution'];
export type CustomAuthorityConfig = z.infer<typeof CustomMintSchema>['authority'];