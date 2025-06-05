import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PublicKey } from "@solana/web3.js";

interface TokenInfo {
    name: string;
    symbol: string;
    description?: string;
    supply: string;
    decimals: string;
    logoUrl?: string | File;
    socialEnabled?: boolean;
    socialLinks?: {
        website?: string;
        twitter?: string;
        telegram?: string;
        discord?: string;
    };
    tags?: string[];
    revokeMintEnabled?: boolean;
    revokeFreezeEnabled?: boolean;
    governanceEnabled?: boolean;
}

interface ValidationErrors {
    name?: string;
    symbol?: string;
    supply?: string;
    decimals?: string;
    logo?: string;
}

interface AllocationItem {
    description: string;
    percentage: number;
    walletAddress: string;
    lockupPeriod: number;
    vesting?: {
        enabled: boolean;
        description: string;
        percentage: number;
        cliff: number;
        duration: number;
        interval: number;
    };
}

interface VestingItem {
    description: string;
    percentage: number;
    cliffPeriod: number;
    vestingDuration: number;
    vestingInterval: number;
}


interface LiquidityItem {
    launchLiquidityOn: {
        name: string;
        icon: string;
        status: 'trending' | 'popular' | 'new';
    };
    liquidityType: 'double' | 'single';
    liquiditySource: 'wallet' | 'sale' | 'bonding' | 'team' | 'external' | 'hybrid';
    liquidityPercentage: number;
    liquidityLockupPeriod: number;
    isAutoBotProtectionEnabled: boolean;
    isAutoListingEnabled: boolean;
    isPriceProtectionEnabled: boolean;
    isMarketMakingEnabled: boolean;
    antiBotSlippageTolerance?: number;
    antiBotMaxTxAmount?: number;
    antiBotCooldown?: number;
    walletLiquidityAmount?: string;
}


interface FeesType {
    mintFee: number;
    burnFee: number;
    transferFee: number;
    adminControls: boolean;
    feeRecipientAddress: string;
    adminAddress?: string;
}

export interface FeesErrors {
    mintFee?: string;
    burnFee?: string;
    transferFee?: string;
    feeRecipientAddress?: string;
    adminAddress?: string;
}

interface LaunchpadType {
    launchType: 'Whitelist' | 'Fair Launch';
    softCap: number;
    hardCap: number;
    startTime: string;
    endTime: string;
    minContribution: number;
    maxContribution: number;
    whitelist: {
        enabled: boolean;
        data: {
            tokenPrice: number;
            whitelistDuration: number;
            walletAddresses: string[];
        };
        errors?: {
            walletAddresses?: { [key: number]: string };
        };
    };
    fairLaunch: {
        enabled: boolean;
        data: {
            tokenPrice: number;
            maxTokensPerWallet: number;
            distributionDelay: number;
        };
    };
}

export interface LaunchpadErrors {
    launchType?: string;
    softCap?: string;
    hardCap?: string;
    startTime?: string;
    endTime?: string;
    minContribution?: string;
    maxContribution?: string;
    whitelist?: {
        enabled?: string;
        tokenPrice?: string;
        whitelistDuration?: string;
        walletAddresses?: string[];
    };
    fairLaunch?: {
        enabled?: string;
        tokenPrice?: string;
        maxTokensPerWallet?: string;
        distributionDelay?: string;
    };
}




export interface TokenDeployerState {
    basicInfo: {
        enabled: boolean;
        data: TokenInfo;
        isValid: boolean;
        errors: ValidationErrors;
    };
    allocation: {
        enabled: boolean;
        data: AllocationItem[];
        isValid?: boolean;
        errors?: {
            totalPercentage?: string;
            walletAddresses?: string[];
        };
    };
    vesting: {
        enabled: boolean;
        data: VestingItem[];
        isValid?: boolean;
        errors?: {
            totalPercentage?: string;
            vestingPeriods?: string[];
        };
    };
    bondingCurve: {
        enabled: boolean;
        data: {
            curveType: string;
            initialPrice: number;
            targetPrice: number;
            maxSupply: number;
        };
        isValid?: boolean;
        errors?: {
            initialPrice?: string;
            targetPrice?: string;
            maxSupply?: string;
        };
    };
    liquidity: {
        enabled: boolean;
        data: LiquidityItem;
        isValid?: boolean;
        errors?: {
            liquidityPercentage?: string;
            liquidityLockupPeriod?: string;
        };
    };
    fees: {
        enabled: boolean;
        data: FeesType;
        isValid?: boolean;
        errors?: FeesErrors;
    };
    launchpad: {
        enabled: boolean;
        data: LaunchpadType;
        isValid?: boolean;
        errors?: LaunchpadErrors;
    };
}

interface TokenDeployerContextType {
    state: TokenDeployerState;
    updateBasicInfo: (data: Partial<TokenInfo>) => void;
    validateBasicInfo: () => boolean;
    validateAllocation: () => boolean;
    validateVesting: () => boolean;
    validateFees: () => boolean;
    validateLiquidity: () => boolean;
    validateBondingCurve: () => boolean;
    validateLaunchpad: () => boolean;
    updateAllocation: (data: AllocationItem[]) => void;
    updateVesting: (data: VestingItem[]) => void;
    updateBondingCurve: (data: Partial<TokenDeployerState['bondingCurve']['data']>) => void;
    updateLiquidity: (data: Partial<TokenDeployerState['liquidity']['data']>) => void;
    updateFees: (data: Partial<TokenDeployerState['fees']['data']>) => void;
    updateLaunchpad: (data: Partial<TokenDeployerState['launchpad']['data']>) => void;
    setStepEnabled: (step: keyof TokenDeployerState, enabled: boolean) => void;
    updateLiquidityField: <K extends keyof TokenDeployerState['liquidity']['data']>(
        field: K,
        value: TokenDeployerState['liquidity']['data'][K]
    ) => void;
    clearSavedState: () => void;
}

const TokenDeployerContext = createContext<TokenDeployerContextType | undefined>(undefined);

const STORAGE_KEY = 'token_deployer_state';

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Helper function to prepare state for storage
const prepareStateForStorage = async (state: TokenDeployerState) => {
    const stateToStore = { ...state };
    
    // Handle logo file
    if (stateToStore.basicInfo.data.logoUrl) {
        try {
            const base64String = await fileToBase64(new File([], ''));
            stateToStore.basicInfo.data.logoUrl = base64String;
        } catch (error) {
            console.error('Error converting logo to base64:', error);
        }
    }
    
    return stateToStore;
};

// Helper function to restore state from storage
const restoreStateFromStorage = (savedState: any): TokenDeployerState => {
    return {
        ...savedState,
        basicInfo: {
            ...savedState.basicInfo,
            data: {
                ...savedState.basicInfo.data,
                logoUrl: savedState.basicInfo.data.logoUrl || undefined // Keep the base64 URL if it exists
            }
        }
    };
};

// Add this function before the TokenDeployerProvider
const uploadLogoToPinata = async (file: File): Promise<string> => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.PUBLIC_JWT_PINATA_SECRET}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.IpfsHash) {
      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    }
    throw new Error('Failed to upload to Pinata');
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
};

export const TokenDeployerProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<TokenDeployerState>(() => {
        // Try to load state from localStorage on initial render
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                return restoreStateFromStorage(parsedState);
            } catch (error) {
                console.error('Error parsing saved state:', error);
            }
        }
        
        // Return default state if no saved state exists
        return {
            basicInfo: {
                enabled: true,
                data: {
                    name: '',
                    symbol: '',
                    description: '',
                    supply: '',
                    decimals: '',
                    logoUrl: undefined,
                    socialEnabled: false
                },
                isValid: false,
                errors: {}
            },
            allocation: {
                enabled: true,
                data: [{
                    description: '',
                    percentage: 100,
                    walletAddress: '',
                    lockupPeriod: 0
                }],
                isValid: false,
                errors: {}
            },
            vesting: {
                enabled: true,
                data: []
            },
            bondingCurve: {
                enabled: true,
                data: {
                    curveType: 'Linear',
                    initialPrice: 0,
                    targetPrice: 0,
                    maxSupply: 0
                }
            },
            liquidity: {
                enabled: true,
                data: {
                    launchLiquidityOn: {
                        name: 'PumpSwap',
                        icon: '/icons/pumpdotfun.png',
                        status: 'trending'
                    },
                    liquidityType: 'double',
                    liquiditySource: 'bonding',
                    liquidityPercentage: 30,
                    liquidityLockupPeriod: 180,
                    isAutoBotProtectionEnabled: true,
                    isAutoListingEnabled: true,
                    isPriceProtectionEnabled: true,
                    isMarketMakingEnabled: true,
                    antiBotSlippageTolerance: 1,
                    antiBotMaxTxAmount: 1,
                    antiBotCooldown: 180
                }
            },
            fees: {
                enabled: true,
                data: {
                    mintFee: 0,
                    burnFee: 0,
                    transferFee: 0,
                    adminControls: false,
                    feeRecipientAddress: '',
                    adminAddress: ''
                }
            },
            launchpad: {
                enabled: true,
                data: {
                    launchType: 'Whitelist',
                    softCap: 0,
                    hardCap: 0,
                    startTime: '',
                    endTime: '',
                    minContribution: 0,
                    maxContribution: 0,
                    whitelist: {
                        enabled: true,
                        data: {
                            tokenPrice: 0,
                            whitelistDuration: 0,
                            walletAddresses: []
                        }
                    },
                    fairLaunch: {
                        enabled: false,
                        data: {
                            tokenPrice: 0,
                            maxTokensPerWallet: 0,
                            distributionDelay: 0
                        }
                    }
                }
            }
        };
    });

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const saveState = async () => {
            try {
                const stateToStore = await prepareStateForStorage(state);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
            } catch (error) {
                console.error('Error saving state to localStorage:', error);
            }
        };
        
        saveState();
    }, [state]);

    // Add function to clear saved state
    const clearSavedState = () => {
        localStorage.removeItem(STORAGE_KEY);
        setState({
            basicInfo: {
                enabled: true,
                data: {
                    name: '',
                    symbol: '',
                    description: '',
                    supply: '',
                    decimals: '',
                    logoUrl: undefined,
                    socialEnabled: false
                },
                isValid: false,
                errors: {}
            },
            allocation: {
                enabled: true,
                data: [{
                    description: '',
                    percentage: 100,
                    walletAddress: '',
                    lockupPeriod: 0
                }],
                isValid: false,
                errors: {}
            },
            vesting: {
                enabled: true,
                data: []
            },
            bondingCurve: {
                enabled: true,
                data: {
                    curveType: 'Linear',
                    initialPrice: 0,
                    targetPrice: 0,
                    maxSupply: 0
                }
            },
            liquidity: {
                enabled: true,
                data: {
                    launchLiquidityOn: {
                        name: 'PumpSwap',
                        icon: '/icons/pumpdotfun.png',
                        status: 'trending'
                    },
                    liquidityType: 'double',
                    liquiditySource: 'bonding',
                    liquidityPercentage: 30,
                    liquidityLockupPeriod: 180,
                    isAutoBotProtectionEnabled: true,
                    isAutoListingEnabled: true,
                    isPriceProtectionEnabled: true,
                    isMarketMakingEnabled: true,
                    antiBotSlippageTolerance: 1,
                    antiBotMaxTxAmount: 1,
                    antiBotCooldown: 180
                }
            },
            fees: {
                enabled: true,
                data: {
                    mintFee: 0,
                    burnFee: 0,
                    transferFee: 0,
                    adminControls: false,
                    feeRecipientAddress: '',
                    adminAddress: ''
                }
            },
            launchpad: {
                enabled: true,
                data: {
                    launchType: 'Whitelist',
                    softCap: 0,
                    hardCap: 0,
                    startTime: '',
                    endTime: '',
                    minContribution: 0,
                    maxContribution: 0,
                    whitelist: {
                        enabled: true,
                        data: {
                            tokenPrice: 0,
                            whitelistDuration: 0,
                            walletAddresses: []
                        }
                    },
                    fairLaunch: {
                        enabled: false,
                        data: {
                            tokenPrice: 0,
                            maxTokensPerWallet: 0,
                            distributionDelay: 0
                        }
                    }
                }
            }
        });
    };

    const validateBasicInfo = () => {
        const errors: ValidationErrors = {};
        const { name, symbol, supply, decimals, logoUrl } = state.basicInfo.data;

        if (!name.trim()) {
            errors.name = 'Name is required';
        } else if (name.length > 50) {
            errors.name = 'Name must be less than 50 characters';
        }

        if (!symbol.trim()) {
            errors.symbol = 'Symbol is required';
        } else if (symbol.length > 10) {
            errors.symbol = 'Symbol must be less than 10 characters';
        }

        if (!supply.trim()) {
            errors.supply = 'Supply is required';
        } else if (isNaN(Number(supply)) || Number(supply) <= 0) {
            errors.supply = 'Supply must be a positive number';
        }

        if (!decimals.trim()) {
            errors.decimals = 'Decimals is required';
        } else if (isNaN(Number(decimals)) || Number(decimals) < 0 || Number(decimals) > 18) {
            errors.decimals = 'Decimals must be between 0 and 18';
        }

        // Logo validation
        if (!logoUrl) {
            errors.logo = 'Logo URL is required';
        }

        const isValid = Object.keys(errors).length === 0;

        setState(prev => ({
            ...prev,
            basicInfo: {
                ...prev.basicInfo,
                isValid,
                errors
            }
        }));

        return isValid;
    };

    const validateAllocation = () => {
        if (!state.allocation.enabled) {
            return true;
        }

        const errors: { totalPercentage?: string; walletAddresses?: string[] } = {};
        const walletErrors: string[] = [];

        // Ensure there's at least one allocation
        if (state.allocation.data.length === 0) {
            updateAllocation([{
                description: '',
                percentage: 100,
                walletAddress: '',
                lockupPeriod: 0
            }]);
        }

        // Validate wallet addresses
        state.allocation.data.forEach((item, index) => {
            if (!item.walletAddress || !item.walletAddress.trim()) {
                walletErrors[index] = 'Wallet address is required';
            } else {
                try {
                    new PublicKey(item.walletAddress);
                } catch (error) {
                    walletErrors[index] = 'Invalid Solana wallet address';
                }
            }
        });

        if (walletErrors.length > 0) {
            errors.walletAddresses = walletErrors;
        }

        const isValid = Object.keys(errors).length === 0;

        setState(prev => ({
            ...prev,
            allocation: {
                ...prev.allocation,
                isValid,
                errors
            }
        }));

        return isValid;
    };

    const validateVesting = () => {
        if (!state.vesting.enabled) return true;

        const errors: { totalPercentage?: string; vestingPeriods?: string[] } = {};
        const vestingErrors: string[] = [];

        if (state.vesting.data.length === 0) {
            errors.totalPercentage = 'At least one vesting schedule is required';
        }

        // Validate vesting periods
        state.vesting.data.forEach((item, index) => {
            if (item.percentage <= 0 || item.percentage > 100) {
                vestingErrors[index] = 'Percentage must be between 0 and 100';
            }
            if (item.cliffPeriod < 0) {
                vestingErrors[index] = 'Cliff period cannot be negative';
            }
            if (item.vestingDuration <= 0) {
                vestingErrors[index] = 'Vesting duration must be greater than 0';
            }
            if (item.vestingInterval <= 0) {
                vestingErrors[index] = 'Vesting interval must be greater than 0';
            }
        });

        const totalPercentage = state.vesting.data.reduce((sum, item) => sum + item.percentage, 0);
        if (totalPercentage !== 100) {
            errors.totalPercentage = 'Total percentage must equal 100%';
        }

        const isValid = Object.keys(errors).length === 0 && vestingErrors.length === 0;

        setState(prev => ({
            ...prev,
            vesting: {
                ...prev.vesting,
                isValid,
                errors
            }
        }));

        return isValid;
    };

    const validateFees = () => {
        if (!state.fees.enabled) return true;
        return state.fees.isValid ?? false;
    };

    const validateLiquidity = () => {
        if (!state.liquidity.enabled) return true;

        const errors: { [key: string]: string } = {};
        const { liquidityPercentage, liquidityLockupPeriod } = state.liquidity.data;

        if (liquidityPercentage <= 0 || liquidityPercentage > 100) {
            errors.liquidityPercentage = 'Liquidity percentage must be between 0 and 100';
        }
        if (liquidityLockupPeriod < 0) {
            errors.liquidityLockupPeriod = 'Lockup period cannot be negative';
        }

        const isValid = Object.keys(errors).length === 0;

        setState(prev => ({
            ...prev,
            liquidity: {
                ...prev.liquidity,
                isValid,
                errors
            }
        }));

        return isValid;
    };

    const validateBondingCurve = () => {
        if (!state.bondingCurve.enabled) return true;

        const errors: { [key: string]: string } = {};
        const { initialPrice, targetPrice, maxSupply } = state.bondingCurve.data;


        if (targetPrice <= initialPrice) {
            errors.targetPrice = 'Target price must be greater than initial price';
        }
        if (maxSupply <= 0) {
            errors.maxSupply = 'Max supply must be greater than 0';
        }

        const isValid = Object.keys(errors).length === 0;

        setState(prev => ({
            ...prev,
            bondingCurve: {
                ...prev.bondingCurve,
                isValid,
                errors
            }
        }));

        return isValid;
    };

    const validateLaunchpad = () => {
        if (!state.launchpad.enabled) return true;

        const errors: { [key: string]: string } = {};
        const { startTime, endTime, softCap, hardCap, minContribution, maxContribution } = state.launchpad.data;

        if (!startTime) {
            errors.startTime = 'Start time is required';
        }
        if (!endTime) {
            errors.endTime = 'End time is required';
        }
        if (new Date(startTime) >= new Date(endTime)) {
            errors.endTime = 'End time must be after start time';
        }
        if (softCap <= 0) {
            errors.softCap = 'Soft cap must be greater than 0';
        }
        if (hardCap <= softCap) {
            errors.hardCap = 'Hard cap must be greater than soft cap';
        }
        if (minContribution <= 0) {
            errors.minContribution = 'Minimum contribution must be greater than 0';
        }
        if (maxContribution <= minContribution) {
            errors.maxContribution = 'Maximum contribution must be greater than minimum';
        }

        const isValid = Object.keys(errors).length === 0;

        setState(prev => ({
            ...prev,
            launchpad: {
                ...prev.launchpad,
                isValid,
                errors
            }
        }));

        return isValid;
    };

    const updateBasicInfo = async (data: Partial<TokenInfo>) => {
        setState(prev => {
            const newData = { ...prev.basicInfo.data, ...data };
            
            // Handle logo upload if a new file is provided
            if (data.logoUrl && typeof data.logoUrl === 'object' && data.logoUrl instanceof File) {
                uploadLogoToPinata(data.logoUrl)
                    .then(ipfsLink => {
                        setState(currentState => ({
                            ...currentState,
                            basicInfo: {
                                ...currentState.basicInfo,
                                data: {
                                    ...currentState.basicInfo.data,
                                    logoUrl: ipfsLink
                                }
                            }
                        }));
                    })
                    .catch(error => {
                        console.error('Error uploading logo:', error);
                    });
            }

            return {
                ...prev,
                basicInfo: {
                    ...prev.basicInfo,
                    data: newData,
                    errors: {}
                }
            };
        });
    };

    const updateAllocation = (data: AllocationItem[]) => {
        setState(prev => ({
            ...prev,
            allocation: {
                ...prev.allocation,
                data
            }
        }));
    };

    const updateVesting = (data: VestingItem[]) => {
        setState(prev => ({
            ...prev,
            vesting: {
                ...prev.vesting,
                data
            }
        }));
    };

    const updateBondingCurve = (data: Partial<TokenDeployerState['bondingCurve']['data']>) => {
        setState(prev => ({
            ...prev,
            bondingCurve: {
                ...prev.bondingCurve,
                data: { ...prev.bondingCurve.data, ...data }
            }
        }));
    };

    const updateLiquidity = (data: Partial<TokenDeployerState['liquidity']['data']>) => {
        setState(prev => ({
            ...prev,
            liquidity: {
                ...prev.liquidity,
                data: { ...prev.liquidity.data, ...data }
            }
        }));
    };

    const updateFees = (data: Partial<TokenDeployerState['fees']['data']>) => {
        setState(prev => {
            const newFeesData = { ...prev.fees.data, ...data };
            // Validate immediately after update
            const errors: { [key: string]: string } = {};
            const { mintFee, burnFee, transferFee, adminControls, feeRecipientAddress, adminAddress } = newFeesData;

            if (mintFee < 0 || mintFee > 100) {
                errors.mintFee = 'Mint fee must be between 0 and 100';
            }
            if (burnFee < 0 || burnFee > 100) {
                errors.burnFee = 'Burn fee must be between 0 and 100';
            }
            if (transferFee < 0 || transferFee > 100) {
                errors.transferFee = 'Transfer fee must be between 0 and 100';
            }

            // Validate fee recipient address
            if (!feeRecipientAddress || feeRecipientAddress.trim() === '') {
                errors.feeRecipientAddress = 'Fee recipient address is required';
            } else {
                try {
                    new PublicKey(feeRecipientAddress.trim());
                } catch (error) {
                    errors.feeRecipientAddress = 'Invalid Solana wallet address';
                }
            }

            // Validate admin address if admin controls are enabled
            if (adminControls && adminAddress && adminAddress.trim() !== '') {
                try {
                    new PublicKey(adminAddress.trim());
                } catch (error) {
                    errors.adminAddress = 'Invalid Solana wallet address';
                }
            }

            const isValid = Object.keys(errors).length === 0;

            return {
                ...prev,
                fees: {
                    ...prev.fees,
                    data: newFeesData,
                    isValid,
                    errors
                }
            };
        });
    };

    const updateLaunchpad = (data: Partial<TokenDeployerState['launchpad']['data']>) => {
        setState(prev => {
            const newData = { ...prev.launchpad.data, ...data };
            
            // Sync whitelist and fairLaunch enabled states with launchType
            if ('launchType' in data) {
                newData.whitelist.enabled = data.launchType === 'Whitelist';
                newData.fairLaunch.enabled = data.launchType === 'Fair Launch';
            }

            return {
                ...prev,
                launchpad: {
                    ...prev.launchpad,
                    data: newData
                }
            };
        });
    };

    const setStepEnabled = (step: keyof TokenDeployerState, enabled: boolean) => {
        setState(prev => ({
            ...prev,
            [step]: {
                ...prev[step],
                enabled,
                ...(enabled ? {} : { isValid: true, errors: {} })
            }
        }));

        if (enabled) {
            switch (step) {
                case 'basicInfo':
                    validateBasicInfo();
                    break;
                case 'allocation':
                    validateAllocation();
                    break;
                case 'vesting':
                    validateVesting();
                    break;
                case 'bondingCurve':
                    validateBondingCurve();
                    break;
                case 'liquidity':
                    validateLiquidity();
                    break;
                case 'fees':
                    validateFees();
                    break;
                case 'launchpad':
                    validateLaunchpad();
                    break;
            }
        }
    };

    const updateLiquidityField = <K extends keyof TokenDeployerState['liquidity']['data']>(
        field: K,
        value: TokenDeployerState['liquidity']['data'][K]
    ) => {
        setState(prev => ({
            ...prev,
            liquidity: {
                ...prev.liquidity,
                data: {
                    ...prev.liquidity.data,
                    [field]: value
                }
            }
        }));
    };

    return (
        <TokenDeployerContext.Provider value={{
            state,
            updateBasicInfo,
            validateBasicInfo,
            validateAllocation,
            validateVesting,
            validateFees,
            validateLiquidity,
            validateBondingCurve,
            validateLaunchpad,
            updateAllocation,
            updateVesting,
            updateBondingCurve,
            updateLiquidity,
            updateFees,
            updateLaunchpad,
            setStepEnabled,
            updateLiquidityField,
            clearSavedState
        }}>
            {children}
        </TokenDeployerContext.Provider>
    );
};

export const useTokenDeployer = () => {
    const context = useContext(TokenDeployerContext);
    if (context === undefined) {
        throw new Error('useTokenDeployer must be used within a TokenDeployerProvider');
    }
    return context;
}; 