import { createContext, useContext, useState, ReactNode } from 'react';

interface TokenInfo {
    name: string;
    symbol: string;
    description?: string;
    supply: string;
    decimals: string;
    logo: File | null;
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
}

interface VestingItem {
    description: string;
    percentage: number;
    walletAddress: string;
    lockupPeriod: number;
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
    };
    vesting: {
        enabled: boolean;
        data: VestingItem[];
    };
    bondingCurve: {
        enabled: boolean;
        data: {
            curveType: string;
            initialPrice: number;
            targetPrice: number;
            maxSupply: number;
        };
    };
    liquidity: {
        enabled: boolean;
        data: {
            liquidityType: 'double' | 'single';
            liquiditySource: 'bonding' | 'team' | 'external';
            liquidityPercentage: number;
            lockupPeriod: number;
            autoListing: boolean;
            priceProtection: boolean;
            marketMaking: boolean;
            antiBotProtection: boolean;
            selectedDex: {
                name: string;
                status: 'trending' | 'popular' | 'new';
                icon: string;
            };
            initialTokenAmount?: number;
            initialSolAmount?: number;
            autoLock?: boolean;
        };
    };
    fees: {
        enabled: boolean;
        data: {
            mintFee: number;
            burnFee: number;
            transferFee: number;
            adminControls: boolean;
            feeRecipient: string;
            adminAddress: string;
        };
    };
    launchpad: {
        enabled: boolean;
        data: {
            startTime: string;
            endTime: string;
            softCap: number;
            hardCap: number;
            minContribution: number;
            maxContribution: number;
        };
    };
}

interface TokenDeployerContextType {
    state: TokenDeployerState;
    updateBasicInfo: (data: Partial<TokenInfo>) => void;
    validateBasicInfo: () => boolean;
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
}

const TokenDeployerContext = createContext<TokenDeployerContextType | undefined>(undefined);

export const TokenDeployerProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<TokenDeployerState>({
        basicInfo: {
            enabled: true,
            data: {
                name: '',
                symbol: '',
                description: '',
                supply: '',
                decimals: '',
                logo: null,
                socialEnabled: false,
            },
            isValid: false,
            errors: {}
        },
        allocation: {
            enabled: true,
            data: []
        },
        vesting: {
            enabled: true,
            data: []
        },
        bondingCurve: {
            enabled: true,
            data: {
                curveType: '',
                initialPrice: 0,
                targetPrice: 0,
                maxSupply: 0
            }
        },
        liquidity: {
            enabled: true,
            data: {
                liquidityType: 'double',
                liquiditySource: 'bonding',
                liquidityPercentage: 30,
                lockupPeriod: 180,
                autoListing: true,
                priceProtection: true,
                marketMaking: true,
                antiBotProtection: true,
                selectedDex: {
                    name: 'PumpSwap',
                    status: 'trending',
                    icon: '/icons/pumpdotfun.png'
                },
                initialTokenAmount: 0,
                initialSolAmount: 0,
                autoLock: false
            }
        },
        fees: {
            enabled: true,
            data: {
                mintFee: 0,
                burnFee: 0,
                transferFee: 0,
                adminControls: false,
                feeRecipient: '',
                adminAddress: ''
            }
        },
        launchpad: {
            enabled: true,
            data: {
                startTime: '',
                endTime: '',
                softCap: 0,
                hardCap: 0,
                minContribution: 0,
                maxContribution: 0
            }
        }
    });

    console.log(state);

    const validateBasicInfo = () => {
        const errors: ValidationErrors = {};
        const { name, symbol, supply, decimals, logo } = state.basicInfo.data;

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

        if (!logo) {
            errors.logo = 'Logo is required';
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

    const updateBasicInfo = (data: Partial<TokenInfo>) => {
        setState(prev => {
            const newState = {
                ...prev,
                basicInfo: {
                    ...prev.basicInfo,
                    data: { ...prev.basicInfo.data, ...data }
                }
            };
            return newState;
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
        setState(prev => ({
            ...prev,
            fees: {
                ...prev.fees,
                data: { ...prev.fees.data, ...data }
            }
        }));
    };

    const updateLaunchpad = (data: Partial<TokenDeployerState['launchpad']['data']>) => {
        setState(prev => ({
            ...prev,
            launchpad: {
                ...prev.launchpad,
                data: { ...prev.launchpad.data, ...data }
            }
        }));
    };

    const setStepEnabled = (step: keyof TokenDeployerState, enabled: boolean) => {
        setState(prev => ({
            ...prev,
            [step]: {
                ...prev[step],
                enabled
            }
        }));
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
            updateAllocation,
            updateVesting,
            updateBondingCurve,
            updateLiquidity,
            updateFees,
            updateLaunchpad,
            setStepEnabled,
            updateLiquidityField
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