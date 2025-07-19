import { create } from 'zustand';
import { 
    BasicInformation, 
    ValidationErrors, 
    DeployStateWithValidation, 
    Socials, 
    TokenDistributionItem, 
    DexListing, 
    Fees, 
    TokenSaleSetup, 
    AdminSetup, 
    LiquiditySourceData, 
    WalletLiquidity, 
    ExternalLiquidity, 
    TeamLiquidity, 
    HybridLiquidity, 
    SaleLiquidity, 
    BondingLiquidity, 
    PricingMechanismData
} from '../types';
import { PublicKey } from '@solana/web3.js';

const initialDeploy = {
    selectedTemplate: 'meme',
    selectedPricing: 'fixed-price',
    selectedExchange: 'fair-launch',
    currentStep: 0,
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
    pricingMechanism: {
        initialPrice: '0',
        finalPrice: '0',
        targetRaise: '0',
        reserveRatio: '0',
        curveType: 'linear'
    } as PricingMechanismData,
    dexListing: {
        launchLiquidityOn: { name: 'PumpSwap', status: 'trending', icon: '/icons/pumpdotfun.png', value: 'pumpdotfun' },
        liquiditySource: 'wallet',
        liquidityData: { 
            type: 'wallet',
            solAmount: 0
        } as LiquiditySourceData,
        liquidityType: 'double',
        liquidityPercentage: 0,
        liquidityLockupPeriod: 0,
        isAutoBotProtectionEnabled: true,
        isAutoListingEnabled: true,
        isPriceProtectionEnabled: true,
    } as DexListing,
    fees: {
        mintFee: 0,
        transferFee: 0,
        burnFee: 0,
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
        revokeMintAuthority: {
            isEnabled: false,
            walletAddress: ''
        },
        revokeFreezeAuthority: {
            isEnabled: false,
            walletAddress: ''
        },
        adminWalletAddress: '',
        adminStructure: 'single',
        tokenOwnerWalletAddress: '',
        numberOfSignatures: 2,
        mintAuthorityWalletAddress: '',
        freezeAuthorityWalletAddress: ''
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
        set((state) => {
            const newState = {
                ...state,
                dexListing: { ...state.dexListing, ...data }
            };
            return newState;
        });
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
        } else if (basicInfo.symbol.length > 5) {
            errors.symbol = 'Symbol must be 5 characters or less';
        }

        if (!basicInfo.supply) {
            errors.supply = 'Supply is required';
        } else if (isNaN(Number(basicInfo.supply)) || Number(basicInfo.supply) <= 0) {
            errors.supply = 'Supply must be a positive number';
        } else if (Number(basicInfo.supply) > 1000000000) {
            errors.supply = 'Supply cannot exceed 1,000,000,000';
        }

        if (!basicInfo.decimals) {
            errors.decimals = 'Decimals is required';
        } else if (isNaN(Number(basicInfo.decimals)) || Number(basicInfo.decimals) < 0) {
            errors.decimals = 'Decimals must be a non-negative number';
        }

        set((state) => ({ ...state, validationErrors: errors }));
        return Object.keys(errors).length === 0;
    },
    validateSocials: () => {
        const { socials } = get();
        const errors: ValidationErrors = {};

        if (!socials.twitter && !socials.telegram && !socials.discord && !socials.farcaster && !socials.website) {
            errors.socials = 'At least one social media or website is required';
        }

        // Website validation - should be a valid domain
        if (socials.website && socials.website.trim()) {
            const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if (!domainRegex.test(socials.website)) {
                errors.website = 'Please enter a valid domain name';
            }
        }

        // Twitter validation - should be a valid username
        if (socials.twitter && socials.twitter.trim()) {
            const twitterRegex = /^[a-zA-Z0-9_]{1,15}$/;
            if (!twitterRegex.test(socials.twitter)) {
                errors.twitter = 'Please enter a valid Twitter/X username (1-15 characters, letters, numbers, and underscores only)';
            }
        }

        // Telegram validation - should be a valid username
        if (socials.telegram && socials.telegram.trim()) {
            const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/;
            if (!telegramRegex.test(socials.telegram)) {
                errors.telegram = 'Please enter a valid Telegram username (5-32 characters, letters, numbers, and underscores only)';
            }
        }

        // Discord validation - should be a valid invite code
        if (socials.discord && socials.discord.trim()) {
            const discordRegex = /^[a-zA-Z0-9]{3,25}$/;
            if (!discordRegex.test(socials.discord)) {
                errors.discord = 'Please enter a valid Discord invite code (3-25 characters, letters and numbers only)';
            }
        }

        // Farcaster validation - should be a valid username
        if (socials.farcaster && socials.farcaster.trim()) {
            const farcasterRegex = /^[a-zA-Z0-9_]{1,16}$/;
            if (!farcasterRegex.test(socials.farcaster)) {
                errors.farcaster = 'Please enter a valid Farcaster username (1-16 characters, letters, numbers, and underscores only)';
            }
        }

        set((state) => ({ ...state, validationErrors: errors }));
        return Object.keys(errors).length === 0;
    },
    validateTokenDistribution: () => {
        const { allocation } = get();
        const errors: ValidationErrors = {};

        if (allocation.length === 0) {
            errors.allocation = 'At least one allocation is required';
            set((state) => ({ ...state, validationErrors: errors }));
            return false;
        }

        let totalPercentage = 0;
        allocation.forEach((item, index) => {
            if (!item.walletAddress || !item.walletAddress.trim()) {
                errors[`allocation_${index}_wallet`] = 'Wallet address is required';
            } else {
                try {
                    new PublicKey(item.walletAddress);
                } catch (error) {
                    errors[`allocation_${index}_wallet`] = 'Invalid Solana wallet address';
                }
            }

            if (item.percentage <= 0) {
                errors[`allocation_${index}_percentage`] = 'Percentage must be greater than 0';
            }
            totalPercentage += item.percentage;

            if (item.vesting.enabled) {
                if (item.vesting.percentage <= 0) {
                    errors[`allocation_${index}_vesting_percentage`] = 'Vesting percentage must be greater than 0';
                }
                if (item.vesting.cliff < 0) {
                    errors[`allocation_${index}_vesting_cliff`] = 'Cliff period cannot be negative';
                }
                if (item.vesting.duration <= 0) {
                    errors[`allocation_${index}_vesting_duration`] = 'Vesting duration must be greater than 0';
                }
                if (item.vesting.interval <= 0) {
                    errors[`allocation_${index}_vesting_interval`] = 'Vesting interval must be greater than 0';
                }
                if (item.vesting.interval > item.vesting.duration) {
                    errors[`allocation_${index}_vesting_interval`] = 'Vesting interval cannot be greater than duration';
                }
            }
        });

        if (totalPercentage !== 100) {
            errors.total_percentage = 'Total allocation percentage must equal 100%';
        }

        set((state) => ({ ...state, validationErrors: errors }));
        return Object.keys(errors).length === 0;
    },
    validateDexListing: () => {
        const { dexListing } = get();
        const errors: ValidationErrors = {};

        if (!dexListing.liquiditySource) {
            errors.liquiditySource = 'Liquidity source is required';
        }

        if (!dexListing.liquidityType) {
            errors.liquidityType = 'Liquidity type is required';
        }

        if (dexListing.liquidityLockupPeriod === undefined || dexListing.liquidityLockupPeriod === null || dexListing.liquidityLockupPeriod < 30) {
            errors.liquidityLockupPeriod = 'Liquidity lockup period must be at least 30 days';
        }

        if (dexListing.liquidityPercentage === undefined || dexListing.liquidityPercentage === null || dexListing.liquidityPercentage < 0 || dexListing.liquidityPercentage > 100) {
            errors.liquidityPercentage = 'Liquidity percentage must be between 0 and 100';
        }

        switch (dexListing.liquiditySource) {
            case 'wallet':
                const walletData = dexListing.liquidityData as WalletLiquidity;
                if (walletData.solAmount === undefined || walletData.solAmount === null || walletData.solAmount < 0) {
                    errors.walletLiquidityAmount = 'Valid SOL amount is required for wallet liquidity';
                }
                break;

            case 'sale':
                const saleData = dexListing.liquidityData as SaleLiquidity;
                if (saleData.percentage === undefined || saleData.percentage === null || saleData.percentage < 0 || saleData.percentage > 100) {
                    errors.salePercentage = 'Valid percentage (0-100) is required for sale liquidity';
                }
                break;

            case 'bonding':
                const bondingData = dexListing.liquidityData as BondingLiquidity;
                if (bondingData.percentage === undefined || bondingData.percentage === null || bondingData.percentage < 0 || bondingData.percentage > 100) {
                    errors.bondingPercentage = 'Valid percentage (0-100) is required for bonding liquidity';
                }
                break;

            case 'team':
                const teamData = dexListing.liquidityData as TeamLiquidity;
                if (teamData.solContribution === undefined || teamData.solContribution === null || teamData.solContribution < 0) {
                    errors.teamSolContribution = 'Valid SOL amount is required for team liquidity';
                }
                if (teamData.percentage === undefined || teamData.percentage === null || teamData.percentage < 0 || teamData.percentage > 100) {
                    errors.teamPercentage = 'Valid percentage (0-100) is required for team liquidity';
                }
                break;

            case 'external':
                const externalData = dexListing.liquidityData as ExternalLiquidity;
                if (externalData.solContribution === undefined || externalData.solContribution === null || externalData.solContribution < 0) {
                    errors.externalSolContribution = 'Valid SOL amount is required for external liquidity';
                }
                if (externalData.tokenAllocation === undefined || externalData.tokenAllocation === null || externalData.tokenAllocation < 0 || externalData.tokenAllocation > 100) {
                    errors.tokenAllocation = 'Valid token allocation percentage (0-100) is required';
                }
                break;

            case 'hybrid':
                const hybridData = dexListing.liquidityData as HybridLiquidity;
                if (!Object.values(hybridData.sources).some(value => value)) {
                    errors.hybridSources = 'At least one liquidity source must be selected';
                }
                break;
        }

        set((state) => ({ ...state, validationErrors: errors }));
        return Object.keys(errors).length === 0;
    },
    validateDexListingOnSubmit: () => {
        const { dexListing } = get();
        const errors: ValidationErrors = {};

        if (!dexListing.liquiditySource) {
            errors.liquiditySource = 'Liquidity source is required';
        }

        if (!dexListing.liquidityType) {
            errors.liquidityType = 'Liquidity type is required';
        }

        if (dexListing.liquidityLockupPeriod === undefined || dexListing.liquidityLockupPeriod === null || dexListing.liquidityLockupPeriod < 30) {
            errors.liquidityLockupPeriod = 'Liquidity lockup period must be at least 30 days';
        }

        if (dexListing.liquidityPercentage === undefined || dexListing.liquidityPercentage === null || dexListing.liquidityPercentage < 0 || dexListing.liquidityPercentage > 100) {
            errors.liquidityPercentage = 'Liquidity percentage must be between 0 and 100';
        }

        switch (dexListing.liquiditySource) {
            case 'wallet':
                const walletData = dexListing.liquidityData as WalletLiquidity;
                if (walletData.solAmount === undefined || walletData.solAmount === null || walletData.solAmount <= 0) {
                    errors.walletLiquidityAmount = 'Valid SOL amount is required for wallet liquidity';
                }
                break;

            case 'sale':
                const saleData = dexListing.liquidityData as SaleLiquidity;
                if (saleData.percentage === undefined || saleData.percentage === null || saleData.percentage <= 0 || saleData.percentage > 100) {
                    errors.salePercentage = 'Valid percentage (0-100) is required for sale liquidity';
                }
                break;

            case 'bonding':
                const bondingData = dexListing.liquidityData as BondingLiquidity;
                if (bondingData.percentage === undefined || bondingData.percentage === null || bondingData.percentage <= 0 || bondingData.percentage > 100) {
                    errors.bondingPercentage = 'Valid percentage (0-100) is required for bonding liquidity';
                }
                break;

            case 'team':
                const teamData = dexListing.liquidityData as TeamLiquidity;
                if (teamData.solContribution === undefined || teamData.solContribution === null || teamData.solContribution <= 0) {
                    errors.teamSolContribution = 'Valid SOL amount is required for team liquidity';
                }
                if (teamData.percentage === undefined || teamData.percentage === null || teamData.percentage <= 0 || teamData.percentage > 100) {
                    errors.teamPercentage = 'Valid percentage (0-100) is required for team liquidity';
                }
                break;

            case 'external':
                const externalData = dexListing.liquidityData as ExternalLiquidity;
                if (externalData.solContribution === undefined || externalData.solContribution === null || externalData.solContribution <= 0) {
                    errors.externalSolContribution = 'Valid SOL amount is required for external liquidity';
                }
                if (externalData.tokenAllocation === undefined || externalData.tokenAllocation === null || externalData.tokenAllocation <= 0 || externalData.tokenAllocation > 100) {
                    errors.tokenAllocation = 'Valid token allocation percentage (0-100) is required';
                }
                break;

            case 'hybrid':
                const hybridData = dexListing.liquidityData as HybridLiquidity;
                if (!Object.values(hybridData.sources).some(value => value)) {
                    errors.hybridSources = 'At least one liquidity source must be selected';
                }
                break;
        }

        set((state) => ({ ...state, validationErrors: errors }));
        return Object.keys(errors).length === 0;
    },
    validateFees: () => {
        const { fees } = get();
        const errors: ValidationErrors = {};

        if (fees.mintFee === undefined || fees.mintFee === null || isNaN(Number(fees.mintFee)) || Number(fees.mintFee) < 0 || Number(fees.mintFee) > 100) {
            errors.mintFee = 'Mint fee must be a number between 0 and 100';
        }

        if (fees.transferFee === undefined || fees.transferFee === null || isNaN(Number(fees.transferFee)) || Number(fees.transferFee) < 0 || Number(fees.transferFee) > 100) {
            errors.transferFee = 'Transfer fee must be a number between 0 and 100';
        }

        if (fees.burnFee === undefined || fees.burnFee === null || isNaN(Number(fees.burnFee)) || Number(fees.burnFee) < 0 || Number(fees.burnFee) > 100) {
            errors.burnFee = 'Burn fee must be a number between 0 and 100';
        }

        const totalFee = Number(fees.mintFee) + Number(fees.transferFee) + Number(fees.burnFee);
        if (!isNaN(totalFee) && totalFee > 100) {
            errors.totalFee = 'The sum of all fees cannot exceed 100%';
        }

        if (!fees.feeRecipientAddress || !fees.feeRecipientAddress.trim()) {
            errors.feeRecipientAddress = 'Fee recipient address is required';
        } else {
            try {
                new PublicKey(fees.feeRecipientAddress);
            } catch (error) {
                errors.feeRecipientAddress = 'Invalid Solana wallet address';
            }
        }

        if (fees.adminControls.isEnabled) {
            if (!fees.adminControls.walletAddress || !fees.adminControls.walletAddress.trim()) {
                errors.adminWalletAddress = 'Admin wallet address is required when admin controls are enabled';
            } else {
                try {
                    new PublicKey(fees.adminControls.walletAddress);
                } catch (error) {
                    errors.adminWalletAddress = 'Invalid Solana wallet address';
                }
            }
        }

        set((state) => ({ ...state, validationErrors: errors }));
        return Object.keys(errors).length === 0;
    },
    validateSaleSetup: () => {
        const { saleSetup } = get();
        const errors: ValidationErrors = {};

        if (!saleSetup.softCap || isNaN(Number(saleSetup.softCap)) || Number(saleSetup.softCap) <= 0) {
            errors.softCap = 'Soft cap must be a positive number';
        }

        if (!saleSetup.hardCap || isNaN(Number(saleSetup.hardCap)) || Number(saleSetup.hardCap) <= 0) {
            errors.hardCap = 'Hard cap must be a positive number';
        }

        if (Number(saleSetup.hardCap) <= Number(saleSetup.softCap)) {
            errors.hardCap = 'Hard cap must be greater than soft cap';
        }

        if (saleSetup.scheduleLaunch.isEnabled) {
            if (!saleSetup.scheduleLaunch.launchDate) {
                errors.launchDate = 'Launch date is required when schedule is enabled';
            }
            if (!saleSetup.scheduleLaunch.endDate) {
                errors.endDate = 'End date is required when schedule is enabled';
            }
            if (saleSetup.scheduleLaunch.launchDate && saleSetup.scheduleLaunch.endDate) {
                const launchDate = new Date(saleSetup.scheduleLaunch.launchDate);
                const endDate = new Date(saleSetup.scheduleLaunch.endDate);
                if (endDate <= launchDate) {
                    errors.endDate = 'End date must be after launch date';
                }
            }
        }

        if (!saleSetup.minimumContribution || isNaN(Number(saleSetup.minimumContribution)) || Number(saleSetup.minimumContribution) <= 0) {
            errors.minimumContribution = 'Minimum contribution must be a positive number';
        }

        if (!saleSetup.maximumContribution || isNaN(Number(saleSetup.maximumContribution)) || Number(saleSetup.maximumContribution) <= 0) {
            errors.maximumContribution = 'Maximum contribution must be a positive number';
        }

        if (Number(saleSetup.maximumContribution) <= Number(saleSetup.minimumContribution)) {
            errors.maximumContribution = 'Maximum contribution must be greater than minimum contribution';
        }

        if (!saleSetup.tokenPrice || isNaN(Number(saleSetup.tokenPrice)) || Number(saleSetup.tokenPrice) <= 0) {
            errors.tokenPrice = 'Token price must be a positive number';
        }

        if (!saleSetup.maxTokenPerWallet || isNaN(Number(saleSetup.maxTokenPerWallet)) || Number(saleSetup.maxTokenPerWallet) <= 0) {
            errors.maxTokenPerWallet = 'Max tokens per wallet must be a positive number';
        }

        if (saleSetup.distributionDelay < 0) {
            errors.distributionDelay = 'Distribution delay cannot be negative';
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
    updatePricingMechanism: (data: Partial<PricingMechanismData>) => {
        set((state) => ({
            ...state,
            pricingMechanism: { ...state.pricingMechanism, ...data }
        }));
    },
    validatePricingMechanism: () => {
        const { pricingMechanism } = get();
        const errors: ValidationErrors = {};

        if (!pricingMechanism.curveType) {
            errors.curveType = 'Please select a curve type';
        }

        if (!pricingMechanism.initialPrice || isNaN(Number(pricingMechanism.initialPrice))) {
            errors.initialPrice = 'Initial price is required';
        }

        if (!pricingMechanism.finalPrice || isNaN(Number(pricingMechanism.finalPrice))) {
            errors.finalPrice = 'Final price is required';
        }

        if (Number(pricingMechanism.finalPrice) <= Number(pricingMechanism.initialPrice)) {
            errors.finalPrice = 'Final price must be greater than initial price';
        }

        if (!pricingMechanism.targetRaise || isNaN(Number(pricingMechanism.targetRaise))) {
            errors.targetRaise = 'Target raise is required';
        }

        if (!pricingMechanism.reserveRatio || isNaN(Number(pricingMechanism.reserveRatio)) || 
            Number(pricingMechanism.reserveRatio) < 0 || Number(pricingMechanism.reserveRatio) > 100) {
            errors.reserveRatio = 'Reserve ratio must be between 0 and 100';
        }

        set((state) => ({ ...state, validationErrors: errors }));
        return Object.keys(errors).length === 0;
    },
    validateAdminSetup: () => {
        const { adminSetup } = get();
        const errors: ValidationErrors = {};

        if (!adminSetup.adminWalletAddress || !adminSetup.adminWalletAddress.trim()) {
            errors.adminWalletAddress = 'Admin wallet address is required';
        } else {
            try {
                new PublicKey(adminSetup.adminWalletAddress);
            } catch (error) {
                errors.adminWalletAddress = 'Invalid Solana wallet address';
            }
        }

        if (!adminSetup.adminStructure) {
            errors.adminStructure = 'Admin structure is required';
        }

        if (adminSetup.revokeMintAuthority.isEnabled) {
            if (adminSetup.revokeMintAuthority.walletAddress && adminSetup.revokeMintAuthority.walletAddress.trim()) {
                try {
                    new PublicKey(adminSetup.revokeMintAuthority.walletAddress);
                } catch (error) {
                    errors.mintAuthorityWalletAddress = 'Invalid Solana wallet address for mint authority';
                }
            }
        }

        if (adminSetup.revokeFreezeAuthority.isEnabled) {
            if (adminSetup.revokeFreezeAuthority.walletAddress && adminSetup.revokeFreezeAuthority.walletAddress.trim()) {
                try {
                    new PublicKey(adminSetup.revokeFreezeAuthority.walletAddress);
                } catch (error) {
                    errors.freezeAuthorityWalletAddress = 'Invalid Solana wallet address for freeze authority';
                }
            }
        }

        if (adminSetup.adminStructure === 'multisig' || adminSetup.adminStructure === 'dao') {
            if (!adminSetup.tokenOwnerWalletAddress || !adminSetup.tokenOwnerWalletAddress.trim()) {
                errors.tokenOwnerWalletAddress = 'Token owner wallet address is required for multi-signature and DAO structures';
            } else {
                try {
                    new PublicKey(adminSetup.tokenOwnerWalletAddress);
                } catch (error) {
                    errors.tokenOwnerWalletAddress = 'Invalid Solana wallet address for token owner';
                }
            }

            if (adminSetup.adminStructure === 'multisig') {
                if (!adminSetup.numberOfSignatures || adminSetup.numberOfSignatures < 1) {
                    errors.numberOfSignatures = 'Number of signatures must be at least 1';
                } else if (adminSetup.numberOfSignatures > 10) {
                    errors.numberOfSignatures = 'Number of signatures cannot exceed 10';
                }
            }
        }

        set((state) => ({ ...state, validationErrors: errors }));
        return Object.keys(errors).length === 0;
    },
}));

