import { z } from 'zod';

// Zod schemas for validation
export const BasicInformationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  description: z.string().optional(),
  supply: z.string().min(1, 'Supply is required'),
  decimals: z.string().min(1, 'Decimals is required'),
  avatarUrl: z.string().min(1, 'Avatar URL is required'),
  bannerUrl: z.string().min(1, 'Banner URL is required'),
});

export const SocialsSchema = z.object({
  website: z.string().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
  farcaster: z.string().optional(),
});

export const VestingParamsSchema = z.object({
  description: z.string().optional(),
  percentage: z.number().min(0).max(100),
  cliff: z.number().min(0),
  duration: z.number().min(0),
  interval: z.number().min(0),
});

export const TokenDistributionItemSchema = z.object({
  description: z.string().optional(),
  percentage: z.number().min(0).max(100),
  walletAddress: z.string().min(1, 'Wallet address is required'),
  lockupPeriod: z.number().min(0),
  vesting: VestingParamsSchema,
});

export const PricingMechanismDataSchema = z.object({
  initialPrice: z.string(),
  finalPrice: z.string(),
  targetRaise: z.string(),
  reserveRatio: z.string(),
  curveType: z.string(),
});

export const DexListingSchema = z.object({
  launchLiquidityOn: z.string(),
  liquiditySource: z.enum(['wallet', 'sale', 'bonding', 'team', 'external', 'hybrid']),
  liquidityData: z.any(), // JSON data
  liquidityType: z.enum(['double', 'single']).optional(),
  liquidityPercentage: z.number().min(0).max(100),
  liquidityLockupPeriod: z.number().min(0),
  isAutoBotProtectionEnabled: z.boolean(),
  isAutoListingEnabled: z.boolean(),
  isPriceProtectionEnabled: z.boolean(),
});

export const FeesSchema = z.object({
  mintFee: z.number().min(0),
  transferFee: z.number().min(0),
  burnFee: z.number().min(0),
  feeRecipientAddress: z.string(),
  adminControls: z.string(),
});

export const TokenSaleSetupSchema = z.object({
  softCap: z.string(),
  hardCap: z.string(),
  scheduleLaunch: z.object({
    launchDate: z.string(),
    endDate: z.string(),
  }),
  minimumContribution: z.string(),
  maximumContribution: z.string(),
  tokenPrice: z.string(),
  maxTokenPerWallet: z.string(),
  distributionDelay: z.number().min(0),
});

export const AdminSetupSchema = z.object({
  revokeMintAuthority: z.string().optional(),
  revokeFreezeAuthority: z.string().optional(),
  adminWalletAddress: z.string(),
  adminStructure: z.enum(['single', 'multisig', 'dao']),
  tokenOwnerWalletAddress: z.string(),
  numberOfSignatures: z.number().min(1),
  mintAuthorityWalletAddress: z.string().optional(),
  freezeAuthorityWalletAddress: z.string().optional(),
});

export const CreateTokenSchema = z.object({
  selectedTemplate: z.string(),
  selectedPricing: z.string(),
  selectedExchange: z.string(),
  basicInfo: BasicInformationSchema,
  socials: SocialsSchema,
  allocation: z.array(TokenDistributionItemSchema),
  pricingMechanism: PricingMechanismDataSchema,
  dexListing: DexListingSchema,
  fees: FeesSchema,
  saleSetup: TokenSaleSetupSchema,
  adminSetup: AdminSetupSchema,
  mintAddress: z.string(),
  owner: z.string(),
});

// TypeScript types
export type BasicInformation = z.infer<typeof BasicInformationSchema>;
export type Socials = z.infer<typeof SocialsSchema>;
export type VestingParams = z.infer<typeof VestingParamsSchema>;
export type TokenDistributionItem = z.infer<typeof TokenDistributionItemSchema>;
export type PricingMechanismData = z.infer<typeof PricingMechanismDataSchema>;
export type DexListing = z.infer<typeof DexListingSchema>;
export type Fees = z.infer<typeof FeesSchema>;
export type TokenSaleSetup = z.infer<typeof TokenSaleSetupSchema>;
export type AdminSetup = z.infer<typeof AdminSetupSchema>;
export type CreateTokenRequest = z.infer<typeof CreateTokenSchema>; 