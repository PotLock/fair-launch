export interface Metadata {
    name: string;
    symbol: string;
    description?: string;
    image?: string;
    banner?: string;
    template?: string;
    pricing?: string;
    exchange?: string;
    social?:{
        website?: string;
        twitter?: string;
        telegram?: string;
        discord?: string;
        farcaster?: string;
    }
}

// Locked Vesting Parameters
export interface LockedVestingParam {
  totalLockedVestingAmount: number;
  numberOfVestingPeriod: number;
  cliffUnlockAmount: number;
  totalVestingDuration: number;
  cliffDurationFromMigrationTime: number;
}

// Fee Scheduler Parameters
export interface FeeSchedulerParam {
  startingFeeBps: number;
  endingFeeBps: number;
  numberOfPeriod: number;
  totalDuration: number;
}

// Rate Limiter Parameters
export interface RateLimiterParam {
  baseFeeBps: number;
  feeIncrementBps: number;
  referenceAmount: number;
  maxLimiterDuration: number;
}

// Base Fee Parameters
export interface BaseFeeParams {
  baseFeeMode: number;
  feeSchedulerParam?: FeeSchedulerParam;
  rateLimiterParam?: RateLimiterParam;
}

// Migration Fee
export interface MigrationFee {
  feePercentage: number;
  creatorFeePercentage: number;
}

// Migrated Pool Fee
export interface MigratedPoolFee {
  collectFeeMode: number;
  dynamicFee: number;
  poolFeeBps: number;
}

// Build Curve Parameters
export interface BuildCurveParams {
  buildCurveMode: number;
  percentageSupplyOnMigration?: number;
  migrationQuoteThreshold?: number;
  initialMarketCap?: number;
  migrationMarketCap?: number;
  liquidityWeights?: number[]; // length 16, nhưng interface ko enforce length
}

// Main DBC Config
export interface DBCConfig {
  buildCurveMode: number;
  totalTokenSupply: number;
  migrationOption: number;
  tokenBaseDecimal: number;
  tokenQuoteDecimal: number;
  dynamicFeeEnabled: boolean;
  activationType: number;
  collectFeeMode: number;
  migrationFeeOption: number;
  tokenType: number;
  partnerLpPercentage: number;
  creatorLpPercentage: number;
  partnerLockedLpPercentage: number;
  creatorLockedLpPercentage: number;
  creatorTradingFeePercentage: number;
  leftover: number;
  tokenUpdateAuthority: number;
  leftoverReceiver: string;
  feeClaimer: string;

  // Build curve optional parameters
  percentageSupplyOnMigration?: number;
  migrationQuoteThreshold?: number;
  initialMarketCap?: number;
  migrationMarketCap?: number;
  liquidityWeights?: number[];

  // Nested schemas
  lockedVestingParam: LockedVestingParam;
  baseFeeParams: BaseFeeParams;
  migrationFee: MigrationFee;
  migratedPoolFee?: MigratedPoolFee;
}

export interface TokenConfig {
  quoteMint: string,
  dbcConfig: DBCConfig;
};

export interface CreateToken {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  decimals: string;
  mintAddress: string;
  owner: string;
  launchpad?: string;
  tokenUri: string;
  bannerUri: string;
  website: string;
  twitter: string;
  telegram: string;
  tags?: string[];
  tokenConfig: TokenConfig;
}

export interface Token {
    id: string;
    name: string;
    symbol: string;
    description: string;
    totalSupply: string;
    decimals: number;
    mintAddress: string;
    owner: string;
    launchpad?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
    metadata: {
        tokenUri: string;
        bannerUri: string;
        website: string;
        twitter: string;
        telegram: string;
        metadataUri: string | null;
        createdAt: string;
        updatedAt: string;
    };
    dbcConfig: {
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
        createdAt: string;
        updatedAt: string;
        buildCurveParams: {
            buildCurveMode: number;
            percentageSupplyOnMigration: string;
            migrationQuoteThreshold: string;
            initialMarketCap: string | null;
            migrationMarketCap: string | null;
            liquidityWeights: any | null;
            createdAt: string;
            updatedAt: string;
        };
        lockedVestingParams: {
            totalLockedVestingAmount: string;
            numberOfVestingPeriod: number;
            cliffUnlockAmount: string;
            totalVestingDuration: number;
            cliffDurationFromMigrationTime: number;
            createdAt: string;
            updatedAt: string;
        };
        baseFeeParams: {
            baseFeeMode: number;
            createdAt: string;
            updatedAt: string;
            feeSchedulerParams: Array<{
                startingFeeBps: number;
                endingFeeBps: number;
                numberOfPeriod: number;
                totalDuration: number;
                createdAt: string;
                updatedAt: string;
            }>;
            rateLimiterParams: any[];
        };
        migrationFee: {
            feePercentage: string;
            creatorFeePercentage: string;
            createdAt: string;
            updatedAt: string;
        };
        migratedPoolFee: any | null;
    };
}

// Swap Parameters Interface
export interface SwapParams {
  baseMint: string;
  signer: string;
  amount: number;
  slippageBps: number;
  swapBaseForQuote: boolean;
  computeUnitPriceMicroLamports?: number;
  referralTokenAccount?: string;
}

// Swap Response Interface
export interface SwapResponse {
  success: boolean;
  data: {
    transaction: string;
    baseMint: string;
    message: string;
  };
}

// Transactions API Types
export type TransactionAction = 'BUY' | 'SELL';
export type TransactionStatus = 'pending' | 'success' | 'failed';

// Request payload for creating a transaction
export interface TransactionCreateRequest {
  userAddress: string;
  txHash: string;
  action: TransactionAction;
  baseToken: string;
  quoteToken: string;
  amountIn: number;
  amountOut: number;
  pricePerToken: number;
  slippageBps: number;
  fee: number;
  feeToken: string;
  status: TransactionStatus;
  chain: string;
  poolAddress: string;
}

// Transaction model returned by the API
export interface Transaction {
  id: string;
  userAddress: string;
  txHash: string;
  action: TransactionAction;
  baseToken: string;
  quoteToken: string;
  amountIn: string | number;
  amountOut: string | number;
  pricePerToken: string | number;
  slippageBps: string | number;
  fee: string | number;
  feeToken: string;
  status: TransactionStatus;
  chain: string;
  poolAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionsListResponse {
  success: boolean;
  transactions: Transaction[];
}

export interface TransactionResponse {
  success: boolean;
  transaction: Transaction;
}

// Update status request payload
export interface TransactionUpdateStatusRequest {
  status: TransactionStatus;
}
