import { z } from "zod";

export interface TokenInfo {
    id: number;
    mintAddress: string;
    owner: string;
    selectedTemplate: string;
    selectedPricing: string;
    selectedExchange: string;
    createdAt: string;
    updatedAt: string;
    basicInfo: {
      name: string;
      symbol: string;
      description: string;
      supply: string;
      decimals: string;
      avatarUrl: string;
      bannerUrl: string;
    };
    socials: {
      website: string;
      twitter: string;
      telegram: string;
      discord: string;
      farcaster: string | null;
    };
    allocations: Array<{
      description: string;
      percentage: number;
      walletAddress: string;
      lockupPeriod: number;
      vesting: {
        description: string;
        percentage: number;
        cliff: number;
        duration: number;
        interval: number;
      };
    }>;
    pricingMechanism: {
      initialPrice: string;
      finalPrice: string;
      targetRaise: string;
      reserveRatio: string;
      curveType: string;
    };
    dexListing: {
      launchLiquidityOn: string;
      liquiditySource: string;
      liquidityData: any;
      liquidityType: string | null;
      liquidityPercentage: number;
      liquidityLockupPeriod: number;
      isAutoBotProtectionEnabled: boolean;
      isAutoListingEnabled: boolean;
      isPriceProtectionEnabled: boolean;
    };
    fees: {
      mintFee: number;
      transferFee: number;
      burnFee: number;
      feeRecipientAddress: string;
      adminControls: string;
    };
    saleSetup: {
      softCap: string;
      hardCap: string;
      scheduleLaunch: {
        launchDate: string;
        endDate: string;
      };
      minimumContribution: string;
      maximumContribution: string;
      tokenPrice: string;
      maxTokenPerWallet: string;
      distributionDelay: number;
    };
    adminSetup: {
      revokeMintAuthority: string;
      revokeFreezeAuthority: string;
      adminWalletAddress: string;
      adminStructure: string;
      tokenOwnerWalletAddress: string;
      numberOfSignatures: number;
      mintAuthorityWalletAddress: string;
      freezeAuthorityWalletAddress: string;
    };
}

export interface Holders {
  amount: number,
  owner: string
}

// Custom Token Creation Schema
export const CustomMintSchema = z.object({
  // --- TOKEN INFO ---
  tokenInfo: z.object({
    name: z.string(),
    symbol: z.string(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    website: z.string().url().optional(),
    twitter: z.string().url().optional(),
    telegram: z.string().url().optional(),
    totalTokenSupply: z.number().positive(),
    tokenBaseDecimal: z.number().min(0),
    tokenQuoteDecimal: z.number().min(0),
  }),

  // --- DBC CONFIGURATION ---
  dbcConfig: z.object({
    buildCurveMode: z.enum(["0", "1", "2", "3"]),
    percentageSupplyOnMigration: z.number().min(0).max(100),
    migrationQuoteThreshold: z.number().positive(),
    migrationOption: z.enum(["0", "1"]),
    dynamicFeeEnabled: z.boolean(),
    activationType: z.enum(["0", "1"]),
    collectFeeMode: z.enum(["0", "1"]),
    migrationFeeOption: z.enum(["0", "1", "2", "3", "4", "5"]),
    tokenType: z.enum(["0", "1"]),
  }),

  // --- FEE CONFIGURATION ---
  baseFeeParams: z.object({
    baseFeeMode: z.enum(["0", "1", "2"]),
    feeSchedulerParam: z.object({
      startingFeeBps: z.number().min(0),
      endingFeeBps: z.number().min(0),
      numberOfPeriod: z.number(),
      totalDuration: z.number(),
    }),
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
  }),

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