import { create } from 'zustand';
import { BasicInformation, ValidationErrors, DeployStateWithValidation, Socials, TokenDistributionItem, DexListing, Fees, TokenSaleSetup, AdminSetup } from '../types';

const initialDeploy = {
    selectedTemplate: 'meme',
    selectedPricing: 'fixed-price',
    selectedExchange: 'fair-launch',
    currentStep: 4,
    basicInfo: {
        name: '',
        symbol: '',
        description: '',
        supply: '',
        decimals: '',
        avatarUrl: '',
        bannerUrl: '',
    } as BasicInformation,
    socials: {
        website: '',
        twitter: '',
        telegram: '',
        discord: '',
        farcaster: '',
    } as Socials,
    allocation: [
        {
            description: '',
            lockupPeriod: 0,
            percentage: 0,
            walletAddress: '',
            vesting: {
                enabled: true,
                description: '',
                percentage: 0,
                cliff: 0,
                duration: 0,
                interval: 0,
            }
        }
    ] as TokenDistributionItem[],
    dexListing: {
        launchLiquidityOn: { name: 'PumpSwap', status: 'trending', icon: '/icons/pumpdotfun.png', value: 'pumpdotfun' },
        liquiditySource: 'wallet',
        liquidityData: { type: 'wallet', solAmount: 0 },
        liquidityPercentage: 0,
        liquidityLockupPeriod: 0,
        isAutoBotProtectionEnabled: true,
        isAutoListingEnabled: true,
        isPriceProtectionEnabled: true,
    } as DexListing,
    fees: {
        mintFee: '0',
        transferFee: '0',
        burnFee: '0',
        feeRecipientAddress: '',
        adminControls: {
            isEnabled: false,
            walletAddress: '',
        }
    } as Fees,
    saleSetup: {
        softCap: "",
        hardCap: "",
        scheduleLaunch: {
            isEnabled: true,
            launchDate: "",
            endDate: ""
        },
        minimumContribution: "",
        maximumContribution: "",
        tokenPrice: "",
        maxTokenPerWallet: "",
        distributionDelay: 0
    } as TokenSaleSetup,
    adminSetup: {
        revokeMintAuthority: false,
        revokeFreezeAuthority: false,
        adminWalletAddress: '',
        adminStructure: 'single'
    } as AdminSetup,
    validationErrors: {} as ValidationErrors,
};

export const useDeployStore = create<DeployStateWithValidation>((set, get) => ({
    ...initialDeploy,
    setSelectedTemplate: (template: string) => {
        set((state) => ({ ...state, selectedTemplate: template }));
    },
    setSelectedPricing: (pricing: string) => {
        set((state) => ({ ...state, selectedPricing: pricing }));
    },
    setSelectedExchange: (exchange: string) => {
        set((state) => ({ ...state, selectedExchange: exchange }));
    },
    setCurrentStep: (step: number) => {
        set((state) => ({ ...state, currentStep: step }));
    },
    updateBasicInfo: (data: Partial<BasicInformation>) => {
        set((state) => ({
            ...state,
            basicInfo: { ...state.basicInfo, ...data }
        }));
    },
    updateSocials: (data: Partial<Socials>) => {
        set((state) => ({
            ...state,
            socials: { ...state.socials, ...data }
        }));
    },
    updateDexListing: (data: Partial<DexListing>) => {
        set((state) => ({
            ...state,
            dexListing: { ...state.dexListing, ...data }
        }));
    },
    updateSaleSetup: (data: Partial<TokenSaleSetup>) => {
        set((state) => ({
            ...state,
            saleSetup: { ...state.saleSetup, ...data }
        }));
    },
    updateAllocation: (data: TokenDistributionItem[]) => {
        set((state) => ({
            ...state,
            allocation: data
        }));
    },
    addAllocation: () => {
        set((state) => ({
            ...state,
            allocation: [...state.allocation, {
                description: '',
                lockupPeriod: 0,
                percentage: 0,
                walletAddress: '',
                vesting: {
                    enabled: true,
                    description: '',
                    percentage: 0,
                    cliff: 0,
                    duration: 0,
                    interval: 0,
                }
            }]
        }));
    },
    removeAllocation: (index: number) => {
        set((state) => ({
            ...state,
            allocation: state.allocation.filter((_, i) => i !== index)
        }));
    },
    updateAllocationItem: (index: number, field: keyof TokenDistributionItem, value: any) => {
        set((state) => {
            const newAllocation = [...state.allocation];
            newAllocation[index] = { ...newAllocation[index], [field]: value };
            return { ...state, allocation: newAllocation };
        });
    },
    updateVestingItem: (index: number, field: keyof TokenDistributionItem['vesting'], value: any) => {
        set((state) => {
            const newAllocation = [...state.allocation];
            newAllocation[index] = {
                ...newAllocation[index],
                vesting: {
                    ...newAllocation[index].vesting,
                    [field]: value
                }
            };
            return { ...state, allocation: newAllocation };
        });
    },
    validateBasicInfo: () => {
        const { basicInfo } = get();
        const errors: ValidationErrors = {};

        if (!basicInfo.name.trim()) {
            errors.name = 'Name is required';
        }

        if (!basicInfo.symbol.trim()) {
            errors.symbol = 'Symbol is required';
        }

        if (!basicInfo.supply) {
            errors.supply = 'Supply is required';
        } else if (isNaN(Number(basicInfo.supply)) || Number(basicInfo.supply) <= 0) {
            errors.supply = 'Supply must be a positive number';
        }

        if (!basicInfo.decimals) {
            errors.decimals = 'Decimals is required';
        } else if (isNaN(Number(basicInfo.decimals)) || Number(basicInfo.decimals) < 0) {
            errors.decimals = 'Decimals must be a non-negative number';
        }

        set((state) => ({ ...state, validationErrors: errors }));
        return Object.keys(errors).length === 0;
    },
    clearValidationErrors: () => {
        set((state) => ({ ...state, validationErrors: {} }));
    },
    resetState: () => {
        set(initialDeploy);
    },
    updateFees: (data: Partial<Fees>) => {
        set((state) => ({
            ...state,
            fees: { ...state.fees, ...data }
        }));
    },
    updateAdminSetup: (data: Partial<AdminSetup>) => {
        set((state) => ({
            ...state,
            adminSetup: { ...state.adminSetup, ...data }
        }));
    },
}));
