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

export interface SwapTokenRequest {
  baseMint: PublicKey;
  signer: PublicKey;
  amount: number;
  slippageBps: number;
  swapBaseForQuote: boolean;
  computeUnitPriceMicroLamports: number;
  referralTokenAccount?: string | null;
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
// Create Token Schema with launchpad field
export const CreateTokenSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  description: z.string().min(1, 'Description is required'),
  totalSupply: z.string().min(1, 'Total supply is required'),
  decimals: z.string().min(1, 'Decimals is required'),
  mintAddress: z.string().min(1, 'Mint address is required'),
  owner: z.string().min(1, 'Owner address is required'),
  launchpad: z.enum(['potlaunch', 'cookedpad']).default('potlaunch'),
  tags: z.array(z.string()).default([]).optional(),
  active: z.boolean().default(true).optional(),
  // Optional metadata fields
  tokenUri: z.string().optional(),
  bannerUri: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  telegram: z.string().url().optional().or(z.literal('')),
  // Token configuration
  tokenConfig: TokenConfigSchema,
});

// Update Token Schema (partial updates)
export const UpdateTokenSchema = z.object({
  name: z.string().min(1).optional(),
  symbol: z.string().min(1).optional(),
  description: z.string().optional(),
  totalSupply: z.string().optional(),
  decimals: z.string().regex(/^\d+$/).optional(),
  mintAddress: z.string().min(1).optional(),
  owner: z.string().min(1).optional(),
  launchpad: z.enum(['potlaunch', 'cookedpad']).optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
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

// Add Swap Token Request Schema
export const SwapTokenRequestSchema = z.object({
  baseMint: z.string().min(1, 'Base mint is required'),
  signer: z.string().min(1, 'Signer public key is required'),
  amount: z.number().positive('Amount must be positive'),
  slippageBps: z.number().int().min(0).max(9900),
  swapBaseForQuote: z.boolean(),
  computeUnitPriceMicroLamports: z.number().int().min(0),
  referralTokenAccount: z.string().nullable().optional(),
});

// Transactions Schemas
export const TransactionActionEnum = z.enum(['BUY', 'SELL']);
export const TransactionStatusEnum = z.enum(['pending', 'success', 'failed']);

export const CreateTransactionSchema = z.object({
  userAddress: z.string().min(1, 'User address is required'),
  txHash: z.string().optional(),
  action: TransactionActionEnum,
  baseToken: z.string().min(1, 'Base token is required'),
  quoteToken: z.string().min(1, 'Quote token is required'),
  amountIn: z.number().positive('amountIn must be positive'),
  amountOut: z.number().positive('amountOut must be positive'),
  pricePerToken: z.number().positive().optional(),
  slippageBps: z.number().min(0).max(9900).optional(),
  fee: z.number().min(0).optional(),
  feeToken: z.string().optional(),
  status: TransactionStatusEnum.optional(),
  chain: z.string().optional(),
  poolAddress: z.string().optional(),
});

export const TransactionQuerySchema = z.object({
  userAddress: z.string().optional(),
  action: TransactionActionEnum.optional(),
  baseToken: z.string().optional(),
  quoteToken: z.string().optional(),
  status: TransactionStatusEnum.optional(),
  chain: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});


// Type definitions
// Database Entity Types
export interface TokenEntity {
  id: string;
  mintAddress: string;
  name: string;
  symbol: string;
  description: string | null;
  totalSupply: string;
  decimals: number;
  owner: string;
  launchpad: 'potlaunch' | 'cookedpad';
  tags: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenMetadataEntity {
  id: string;
  tokenId: string;
  tokenUri: string | null;
  bannerUri: string | null;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  metadataUri: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbcConfigEntity {
  id: string;
  tokenId: string;
  quoteMint: string;
  buildCurveMode: number;
  totalTokenSupply: string;
  migrationOption: number;
  tokenBaseDecimal: number;
  tokenQuoteDecimal: number;
  dynamicFeeEnabled: boolean;
  activationType: number;
  collectFeeMode: number;
  migrationFeeOption: number;
  tokenType: number;
  partnerLpPercentage: string;
  creatorLpPercentage: string;
  partnerLockedLpPercentage: string;
  creatorLockedLpPercentage: string;
  creatorTradingFeePercentage: string;
  leftover: string;
  tokenUpdateAuthority: number;
  leftoverReceiver: string;
  feeClaimer: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuildCurveParamsEntity {
  id: string;
  dbcConfigId: string;
  buildCurveMode: number;
  percentageSupplyOnMigration: string | null;
  migrationQuoteThreshold: string | null;
  initialMarketCap: string | null;
  migrationMarketCap: string | null;
  liquidityWeights: number[] | null; // JSONB field from database
  createdAt: Date;
  updatedAt: Date;
}

export interface LockedVestingParamsEntity {
  id: string;
  dbcConfigId: string;
  totalLockedVestingAmount: string;
  numberOfVestingPeriod: number;
  cliffUnlockAmount: string;
  totalVestingDuration: number;
  cliffDurationFromMigrationTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseFeeParamsEntity {
  id: string;
  dbcConfigId: string;
  baseFeeMode: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeSchedulerParamsEntity {
  id: string;
  baseFeeParamsId: string;
  startingFeeBps: number;
  endingFeeBps: number;
  numberOfPeriod: number;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimiterParamsEntity {
  id: string;
  baseFeeParamsId: string;
  baseFeeBps: number;
  feeIncrementBps: number;
  referenceAmount: string;
  maxLimiterDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MigrationFeesEntity {
  id: string;
  dbcConfigId: string;
  feePercentage: string;
  creatorFeePercentage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MigratedPoolFeesEntity {
  id: string;
  dbcConfigId: string;
  collectFeeMode: number;
  dynamicFee: number;
  poolFeeBps: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenTransactionsEntity {
  id: string;
  tokenId: string;
  transactionHash: string;
  operation: string;
  status: string;
  amount: string | null;
  fee: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionEntity {
  id: string;
  userAddress: string;
  txHash: string | null;
  action: 'BUY' | 'SELL';
  baseToken: string;
  quoteToken: string;
  amountIn: string;
  amountOut: string;
  pricePerToken: string | null;
  slippageBps: string; // stored as numeric in DB
  fee: string;
  feeToken: string;
  status: 'pending' | 'success' | 'failed';
  chain: string;
  poolAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Complete Token with Relations
export interface TokenWithRelations extends TokenEntity {
  metadata?: TokenMetadataEntity | null;
  dbcConfig?: DbcConfigWithRelations | null;
}

export interface DbcConfigWithRelations extends DbcConfigEntity {
  buildCurveParams?: BuildCurveParamsEntity | null;
  lockedVestingParams?: LockedVestingParamsEntity | null;
  baseFeeParams?: BaseFeeParamsWithRelations | null;
  migrationFee?: MigrationFeesEntity | null;
  migratedPoolFee?: MigratedPoolFeesEntity | null;
}

export interface BaseFeeParamsWithRelations extends BaseFeeParamsEntity {
  feeSchedulerParams?: FeeSchedulerParamsEntity[] | null;
  rateLimiterParams?: RateLimiterParamsEntity[] | null;
}

// Clean Response Types (without internal IDs)
export interface CleanTokenResponse {
  id: string;
  name: string;
  symbol: string;
  description: string | null;
  totalSupply: string;
  decimals: number;
  mintAddress: string;
  owner: string;
  launchpad: 'potlaunch' | 'cookedpad';
  tags?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Omit<TokenMetadataEntity, 'id' | 'tokenId'>;
  dbcConfig?: CleanDbcConfigResponse;
}

export interface CleanDbcConfigResponse extends Omit<DbcConfigEntity, 'id' | 'tokenId'> {
  buildCurveParams?: Omit<BuildCurveParamsEntity, 'id' | 'dbcConfigId'>;
  lockedVestingParams?: Omit<LockedVestingParamsEntity, 'id' | 'dbcConfigId'>;
  baseFeeParams?: CleanBaseFeeParamsResponse;
  migrationFee?: Omit<MigrationFeesEntity, 'id' | 'dbcConfigId'>;
  migratedPoolFee?: Omit<MigratedPoolFeesEntity, 'id' | 'dbcConfigId'>;
}

export interface CleanBaseFeeParamsResponse extends Omit<BaseFeeParamsEntity, 'id' | 'dbcConfigId'> {
  feeSchedulerParams?: Omit<FeeSchedulerParamsEntity, 'id' | 'baseFeeParamsId'>[];
  rateLimiterParams?: Omit<RateLimiterParamsEntity, 'id' | 'baseFeeParamsId'>[];
}

// Request/Response Types
export type CreateTokenRequest = z.infer<typeof CreateTokenSchema>;
export type UpdateTokenRequest = z.infer<typeof UpdateTokenSchema>;
export type DbcConfigRequestType = z.infer<typeof DbcConfigRequestSchema>;
export type DeployTokenRequestType = z.infer<typeof DeployTokenRequestSchema>;
export type TokenConfig = z.infer<typeof TokenConfigSchema>;
export type DBCConfig = z.infer<typeof DBCConfigSchema>;
// Add Swap Token Request Type
export type SwapTokenRequestType = z.infer<typeof SwapTokenRequestSchema>;
// Transactions Types
export type CreateTransactionRequest = z.infer<typeof CreateTransactionSchema>;
export type TransactionQueryRequest = z.infer<typeof TransactionQuerySchema>;
export type BuildCurveParams = z.infer<typeof BuildCurveParamsSchema>;
export type LockedVestingParam = z.infer<typeof LockedVestingParamSchema>;
export type FeeSchedulerParam = z.infer<typeof FeeSchedulerParamSchema>;
export type RateLimiterParam = z.infer<typeof RateLimiterParamSchema>;
export type BaseFeeParams = z.infer<typeof BaseFeeParamsSchema>;
export type MigrationFee = z.infer<typeof MigrationFeeSchema>;
export type MigratedPoolFee = z.infer<typeof MigratedPoolFeeSchema>;
