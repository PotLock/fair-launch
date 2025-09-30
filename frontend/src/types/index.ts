import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
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
  enabled: z.boolean().optional(),
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
  launchLiquidityOn: z.union([
    z.string(),
    z.object({
      name: z.string(),
      status: z.string(),
      icon: z.string(),
      value: z.string(),
    })
  ]),
  liquiditySource: z.enum(['wallet', 'sale', 'bonding', 'team', 'external', 'hybrid']),
  liquidityData: z.any(), // JSON data
  liquidityType: z.enum(['double', 'single']).optional(),
  liquidityPercentage: z.number().min(0).max(100),
  liquidityLockupPeriod: z.number().min(0),
  walletLiquidityAmount: z.number().optional(),
  externalSolContribution: z.number().optional(),
  isAutoBotProtectionEnabled: z.boolean(),
  isAutoListingEnabled: z.boolean(),
  isPriceProtectionEnabled: z.boolean(),
});

export const FeesSchema = z.object({
  mintFee: z.number().min(0),
  transferFee: z.number().min(0),
  burnFee: z.number().min(0),
  feeRecipientAddress: z.string(),
  adminControls: z.union([
    z.string(),
    z.object({
      isEnabled: z.boolean(),
      walletAddress: z.string().optional(),
    })
  ]),
});

export const TokenSaleSetupSchema = z.object({
  softCap: z.string(),
  hardCap: z.string(),
  scheduleLaunch: z.object({
    isEnabled: z.boolean().optional(),
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
  revokeMintAuthority: z.union([
    z.string(),
    z.object({
      isEnabled: z.boolean(),
      walletAddress: z.string().optional(),
    })
  ]).optional(),
  revokeFreezeAuthority: z.union([
    z.string(),
    z.object({
      isEnabled: z.boolean(),
      walletAddress: z.string().optional(),
    })
  ]).optional(),
  adminWalletAddress: z.string(),
  adminStructure: z.enum(['single', 'multisig', 'dao']),
  tokenOwnerWalletAddress: z.string().optional(),
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

// TypeScript types derived from Zod schemas
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

export interface TokenTemplate {
    key: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
}

export interface TokenDeployerSteps {
    currentStep: number;
}

export interface TokenDeployerStep {
    label: string;
    description: string;
}

export interface SaleType {
    label: string;
    icon: React.ReactNode;
    color: string;
    value: string;
}

export interface PricingOption {
    key: string;
    title: string;
    desc: string;
    badges: SaleType[];
}

export interface PricingMechanismProps {
    selected?: string;
    onSelect?: (key: string) => void;
}

export interface ExchangeType {
    title: string;
    desc: string;
    pricing: {
        label: string;
        icon: React.ReactNode;
        color: string;
    }[];
    value: string;
}

export interface ValidationErrors {
    [key: string]: string;
}

export interface DeployStateWithValidation extends DeployState {
    validationErrors: ValidationErrors;
    validateBasicInfo: () => boolean;
    validateSocials: () => boolean;
    validateTokenDistribution: () => boolean;
    validateDexListing: () => boolean;
    validateFees: () => boolean;
    validateSaleSetup: () => boolean;
    validatePricingMechanism: () => boolean;
    validateAdminSetup: () => boolean;
    clearValidationErrors: () => void;
    updateAllocation: (data: TokenDistributionItem[]) => void;
    addAllocation: () => void;
    removeAllocation: (index: number) => void;
    updateAllocationItem: (index: number, field: keyof TokenDistributionItem, value: any) => void;
    updateVestingItem: (index: number, field: keyof VestingParams, value: any) => void;
    saleSetup: TokenSaleSetup;
    updateSaleSetup: (data: Partial<TokenSaleSetup>) => void;
    adminSetup: AdminSetup;
    updateAdminSetup: (data: Partial<AdminSetup>) => void;
}


export interface DeployState {
    selectedTemplate: string;
    setSelectedTemplate: (template: string) => void;
    selectedPricing: string;
    setSelectedPricing: (pricing: string) => void;
    selectedExchange: string;
    setSelectedExchange: (exchange: string) => void;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    basicInfo: BasicInformation;
    updateBasicInfo: (data: Partial<BasicInformation>) => void;
    socials: Socials;
    updateSocials: (data: Partial<Socials>) => void;
    allocation: TokenDistributionItem[];
    dexListing: DexListing;
    updateDexListing: (data: Partial<DexListing>) => void;
    fees: Fees;
    updateFees: (data: Partial<Fees>) => void;
    saleSetup: TokenSaleSetup;
    updateSaleSetup: (data: Partial<TokenSaleSetup>) => void;
    adminSetup: AdminSetup;
    updateAdminSetup: (data: Partial<AdminSetup>) => void;
    pricingMechanism: PricingMechanismData;
    updatePricingMechanism: (data: Partial<PricingMechanismData>) => void;
    resetState: () => void;
}





export interface DexOption {
    name: string;
    status: 'trending' | 'popular' | 'new';
    icon: string;
    value: string;
}

export interface WalletLiquidity {
    type: 'wallet';
    solAmount: number;
}

export interface SaleLiquidity {
    type: 'sale';
    percentage: number;
}

export interface BondingLiquidity {
    type: 'bonding';
    percentage: number;
}

export interface TeamLiquidity {
    type: 'team';
    percentage: number;
    solContribution: number;
}

export interface ExternalLiquidity {
    type: 'external';
    solContribution: number;
    tokenAllocation: number;
}

export interface HybridLiquidity {
    type: 'hybrid';
    sources: {
        wallet: boolean;
        sale: boolean;
        bonding: boolean;
        team: boolean;
    };
}

export type LiquiditySourceData = 
    | WalletLiquidity 
    | SaleLiquidity 
    | BondingLiquidity 
    | TeamLiquidity 
    | ExternalLiquidity 
    | HybridLiquidity;


export interface PricingTemplate {
    label: string;
    description: string;
    type?: string;
    priceRange?: string;
    usedBy?: string;
    icon: string;
    color: string;
    style: string;
    value: string;
    longDescription?: string;
}

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

export interface Holders {
    amount: number,
    owner: string
}

export interface StepProps {
    isExpanded: boolean;
    stepKey: string;
    onHeaderClick: (stepKey: string) => void;
}

export interface DeploymentOption {
    name: string;
    logo: string;
    description: string;
    availableDexes: string;
    cost: string;
    estimatedTime: string;
    disabled?: boolean;
}

export interface Token {
    id: number;
    mintAddress: string;
    owner: string;
    selectedTemplate: string;
    selectedPricing: string;
    selectedExchange: string;
    createdAt: string;
    updatedAt: string;
    basicInfo: BasicInformation;
    socials: Socials;
    allocations: TokenDistributionItem[];
    pricingMechanism: PricingMechanismData;
    dexListing: DexListing;
    fees: Fees;
    saleSetup: TokenSaleSetup;
    adminSetup: AdminSetup;
}

export interface Pool {
    bump: number;
    configId: PublicKey;
    creatorFeesMintA: BN;
    creatorFeesMintB: BN;
    enableCreatorFee: boolean;
    epoch: BN;
    feeOn: number;
    fundFeesMintA: BN;
    fundFeesMintB: BN;
    lpAmount: BN;
    lpDecimals: number;
    mintA: PublicKey;
    mintB: PublicKey;
    mintDecimalA: number;
    mintDecimalB: number;
    mintLp: PublicKey;
    mintProgramA: PublicKey;
    mintProgramB: PublicKey;
    observationId: PublicKey;
    openTime: BN;
    poolCreator: PublicKey;
    poolId: PublicKey;
    protocolFeesMintA: BN;
    protocolFeesMintB: BN;
    status: number;
    vaultA: PublicKey;
    vaultB: PublicKey;
}

export interface TokenMetadata {
    name: string;
    symbol: string;
    image?: string;
    description?: string;
}

export interface PoolMetric {
    label: string;
    value: string;
    isHighlighted?: boolean;
}

export interface EnhancedPool extends Pool {
    // Display information
    token1Metadata: TokenMetadata;
    token2Metadata: TokenMetadata;
    token1Icon: string;
    token2Icon: string;
    poolName: string;
    chain: {
        name: string;
        icon: string;
    };
    platforms: Array<{
        platform: string;
        platformIcon: string;
    }>;
    metrics: PoolMetric[];
    isExpanded?: boolean;
    position?: {
        value: string;
        apr: string;
        poolShare: string;
    };
}

