import React from 'react';

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
    updateVestingItem: (index: number, field: keyof TokenDistributionItem['vesting'], value: any) => void;
    saleSetup: TokenSaleSetup;
    updateSaleSetup: (data: Partial<TokenSaleSetup>) => void;
    adminSetup: AdminSetup;
    updateAdminSetup: (data: Partial<AdminSetup>) => void;
}

export interface PricingMechanismData {
    initialPrice: string;
    finalPrice: string;
    targetRaise: string;
    reserveRatio: string;
    curveType: string;
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

export interface BasicInformation {
    name: string;
    symbol: string;
    description: string;
    supply: string;
    decimals: string;
    avatarUrl: string;
    bannerUrl: string;
}

export interface Socials {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    farcaster?: string;
}

export interface VestingParams {
    enabled: boolean;
    description?: string;
    percentage: number;
    cliff: number;
    duration: number;
    interval: number;
}

export interface TokenDistributionItem {
    description?: string;
    percentage: number;
    walletAddress: string;
    lockupPeriod: number;
    vesting: VestingParams;
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

export interface DexListing {
    launchLiquidityOn: DexOption;
    liquiditySource: 'wallet' | 'sale' | 'bonding' | 'team' | 'external' | 'hybrid';
    liquidityData: LiquiditySourceData;
    liquidityType?: 'double' | 'single';
    liquidityPercentage: number;
    liquidityLockupPeriod: number;
    walletLiquidityAmount?: number;
    externalSolContribution?: number;
    isAutoBotProtectionEnabled: boolean;
    isAutoListingEnabled: boolean;
    isPriceProtectionEnabled: boolean;
}

export interface Fees {
    mintFee: number;
    transferFee: number;
    burnFee: number;
    feeRecipientAddress: string;
    adminControls: {
        isEnabled: boolean;
        walletAddress: string;
    }
}

export interface TokenSaleSetup {
    softCap: string;
    hardCap: string;
    scheduleLaunch: {
        isEnabled: boolean;
        launchDate: string;
        endDate: string;
    };
    minimumContribution: string;
    maximumContribution: string;
    tokenPrice: string;
    maxTokenPerWallet: string;
    distributionDelay: number;
}

export interface AdminSetup {
    revokeMintAuthority: {
        isEnabled: boolean;
        walletAddress: string;
    };
    revokeFreezeAuthority: {
        isEnabled: boolean;
        walletAddress: string;
    };
    adminWalletAddress: string;
    adminStructure: 'single' | 'multisig' | 'dao';
    tokenOwnerWalletAddress: string;
    numberOfSignatures: number;
    mintAuthorityWalletAddress?: string;
    freezeAuthorityWalletAddress?: string;
}

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