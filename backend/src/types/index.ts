import type { DbcConfig } from '@cookedbusiness/halfbaked-sdk';
import type { Keypair, PublicKey } from '@solana/web3.js';
import { z } from 'zod';

export interface TokenMetadata {
  uri?: string;
  name: string;
  symbol: string;
  imageUri?: string;
  bannerUri?: string;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export const TokenMetadataRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  description: z.string().min(1, 'Description is required'),
  imageUri: z.string().optional(),
  bannerUri: z.string().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
});

export type TokenMetadataRequest = z.infer<typeof TokenMetadataRequestSchema>;

export interface DbcConfigRequest {
  metadata: TokenMetadata;
  signer: PublicKey;
}

export interface DeployTokenRequest extends DbcConfigRequest {
  dbcConfigKeypair: Keypair;
}

// IPFS Upload Schemas
export const UploadImageSchema = z.object({
  fileName: z.string().optional(),
});

export const UploadMetadataSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  imageUri: z.string().min(1, 'Image URI is required'),
  bannerUri: z.string().min(1, 'Banner URI is required'),
  description: z.string().min(1, 'Description is required'),
  website: z.string().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
});

export type UploadImageRequest = z.infer<typeof UploadImageSchema>;
export type UploadMetadataRequest = z.infer<typeof UploadMetadataSchema>;

// Build Curve Parameters Schema
export const BuildCurveParamsSchema = z.object({
  buildCurveMode: z.number().int().min(0).max(3),
  percentageSupplyOnMigration: z.number().min(0).max(100).optional(),
  migrationQuoteThreshold: z.number().min(0).optional(),
  initialMarketCap: z.number().min(0).optional(),
  migrationMarketCap: z.number().min(0).optional(),
  liquidityWeights: z.array(z.number()).length(16).optional(),
});

// Locked Vesting Parameters Schema
export const LockedVestingParamSchema = z.object({
  totalLockedVestingAmount: z.number().min(0),
  numberOfVestingPeriod: z.number().int().min(0),
  cliffUnlockAmount: z.number().min(0),
  totalVestingDuration: z.number().int().min(0),
  cliffDurationFromMigrationTime: z.number().int().min(0),
});

// Fee Scheduler Parameters Schema
export const FeeSchedulerParamSchema = z.object({
  startingFeeBps: z.number().int().min(1).max(9900),
  endingFeeBps: z.number().int().min(1).max(9900),
  numberOfPeriod: z.number().int().min(0),
  totalDuration: z.number().int().min(0),
});

// Rate Limiter Parameters Schema
export const RateLimiterParamSchema = z.object({
  baseFeeBps: z.number().int().min(1).max(9900),
  feeIncrementBps: z.number().int().min(1).max(9900),
  referenceAmount: z.number().min(0),
  maxLimiterDuration: z.number().int().min(0),
});

// Base Fee Parameters Schema
export const BaseFeeParamsSchema = z.object({
  baseFeeMode: z.number().int().min(0).max(2),
  feeSchedulerParam: FeeSchedulerParamSchema.optional(),
  rateLimiterParam: RateLimiterParamSchema.optional(),
});

// Migration Fee Schema
export const MigrationFeeSchema = z.object({
  feePercentage: z.number().min(0).max(50),
  creatorFeePercentage: z.number().min(0).max(100),
});

// Migrated Pool Fee Schema
export const MigratedPoolFeeSchema = z.object({
  collectFeeMode: z.number().int().min(0).max(1),
  dynamicFee: z.number().int().min(0).max(1),
  poolFeeBps: z.number().int().min(10).max(1000),
});

// DBC Configuration Schema
export const DBCConfigSchema = z.object({
  buildCurveMode: z.number().int().min(0).max(3),
  totalTokenSupply: z.number().positive(),
  migrationOption: z.number().int().min(0).max(1),
  tokenBaseDecimal: z.number().int().min(0).max(9),
  tokenQuoteDecimal: z.number().int().min(0).max(9),
  dynamicFeeEnabled: z.boolean(),
  activationType: z.number().int().min(0).max(1),
  collectFeeMode: z.number().int().min(0).max(1),
  migrationFeeOption: z.number().int().min(0).max(6),
  tokenType: z.number().int().min(0).max(1),
  partnerLpPercentage: z.number().min(0).max(100),
  creatorLpPercentage: z.number().min(0).max(100),
  partnerLockedLpPercentage: z.number().min(0).max(100),
  creatorLockedLpPercentage: z.number().min(0).max(100),
  creatorTradingFeePercentage: z.number().min(0).max(100),
  leftover: z.number().min(0),
  tokenUpdateAuthority: z.number().int().min(0).max(4),
  leftoverReceiver: z.string().min(1),
  feeClaimer: z.string().min(1),
  // Build curve specific parameters
  percentageSupplyOnMigration: z.number().min(0).max(100).optional(),
  migrationQuoteThreshold: z.number().min(0).optional(),
  initialMarketCap: z.number().min(0).optional(),
  migrationMarketCap: z.number().min(0).optional(),
  liquidityWeights: z.array(z.number()).length(16).optional(),
  // Locked vesting parameters
  lockedVestingParam: LockedVestingParamSchema,
  // Base fee parameters
  baseFeeParams: BaseFeeParamsSchema,
  // Migration fee
  migrationFee: MigrationFeeSchema,
  // Migrated pool fee (optional)
  migratedPoolFee: MigratedPoolFeeSchema.optional(),
});

// Token Configuration Schema
export const TokenConfigSchema = z.object({
  quoteMint: z.string().min(1, 'Quote mint is required'),
  dbcConfig: DBCConfigSchema,
});


// Token Creation Schemas
export const CreateTokenSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  description: z.string().min(1, 'Description is required'),
  totalSupply: z.string().min(1, 'Total supply is required'),
  decimals: z.string().min(1, 'Decimals is required'),
  mintAddress: z.string().min(1, 'Mint address is required'),
  owner: z.string().min(1, 'Owner address is required'),
  // Optional metadata fields
  tokenUri: z.string().optional(),
  bannerUri: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  telegram: z.string().url().optional().or(z.literal('')),
  // DBC Configuration (required for integrated flow)
  tokenConfig: TokenConfigSchema,
});


// Schema for DBC Config Request
export const DbcConfigRequestSchema = z.object({
  metadata: TokenMetadataRequestSchema,
  signer: z.string().min(1, 'Signer public key is required'),
});

// Schema for Deploy Token Request
export const DeployTokenRequestSchema = z.object({
  metadata: TokenMetadataRequestSchema,
  signer: z.string().min(1, 'Signer public key is required'),
  dbcConfigKeypair: z.object({
    publicKey: z.record(z.string(), z.number()).refine(
      (obj) => Object.keys(obj).length === 32,
      'Public key must have exactly 32 bytes'
    ),
    secretKey: z.record(z.string(), z.number()).refine(
      (obj) => Object.keys(obj).length === 64,
      'Secret key must have exactly 64 bytes'
    ),
  }),
});


// Type definitions
export type CreateTokenRequest = z.infer<typeof CreateTokenSchema>;
export type DbcConfigRequestType = z.infer<typeof DbcConfigRequestSchema>;
export type DeployTokenRequestType = z.infer<typeof DeployTokenRequestSchema>;
export type TokenConfig = z.infer<typeof TokenConfigSchema>;
export type DBCConfig = z.infer<typeof DBCConfigSchema>;
export type BuildCurveParams = z.infer<typeof BuildCurveParamsSchema>;
export type LockedVestingParam = z.infer<typeof LockedVestingParamSchema>;
export type FeeSchedulerParam = z.infer<typeof FeeSchedulerParamSchema>;
export type RateLimiterParam = z.infer<typeof RateLimiterParamSchema>;
export type BaseFeeParams = z.infer<typeof BaseFeeParamsSchema>;
export type MigrationFee = z.infer<typeof MigrationFeeSchema>;
export type MigratedPoolFee = z.infer<typeof MigratedPoolFeeSchema>;